import User from "../models/user.model.js";
import Emergency from "../models/emergencyrequest.model.js";
import Booking from "../models/booking.model.js";
import bcrypt from "bcryptjs";

const emergencyPopulation = [
    { path: "user", select: "name email mobile city" },
    { path: "ambulance", select: "name email mobile vehicleNumber" }
];

const bookingPopulation = [
    { path: "user", select: "name email mobile city" },
    { path: "hospital", select: "name email mobile address city" },
    { path: "ambulance", select: "name email mobile vehicleNumber" }
];

const validRoles = ["user", "ambulance", "ambulance_driver", "admin", "police", "police_hq", "hospital", "hospital_admin"];
const analyticsTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
const supportedRanges = ["1D", "3D", "5D", "1M", "3M", "6M", "1Y"];

const pad = (value) => String(value).padStart(2, "0");

const getRangeConfig = (range) => {
    switch (range) {
        case "1D":
            return { unit: "hour", points: 24, groupFormat: "%Y-%m-%dT%H" };
        case "3D":
            return { unit: "day", points: 3, groupFormat: "%Y-%m-%d" };
        case "5D":
            return { unit: "day", points: 5, groupFormat: "%Y-%m-%d" };
        case "1M":
            return { unit: "day", points: 30, groupFormat: "%Y-%m-%d" };
        case "3M":
            return { unit: "month", points: 3, groupFormat: "%Y-%m" };
        case "6M":
            return { unit: "month", points: 6, groupFormat: "%Y-%m" };
        case "1Y":
            return { unit: "month", points: 12, groupFormat: "%Y-%m" };
        default:
            return { unit: "hour", points: 24, groupFormat: "%Y-%m-%dT%H" };
    }
};

const getBucketKey = (date, unit) => {
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());

    if (unit === "hour") {
        return `${year}-${month}-${day}T${pad(date.getHours())}`;
    }

    if (unit === "month") {
        return `${year}-${month}`;
    }

    return `${year}-${month}-${day}`;
};

const getBucketLabel = (date, range, unit) => {
    if (unit === "hour") {
        return date.toLocaleTimeString("en-IN", {
            hour: "numeric",
            hour12: true,
            timeZone: analyticsTimeZone
        });
    }

    if (unit === "month") {
        return date.toLocaleDateString("en-IN", {
            month: "short",
            ...(range === "1Y" ? { year: "numeric" } : {}),
            timeZone: analyticsTimeZone
        });
    }

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        timeZone: analyticsTimeZone
    });
};

const buildBucketSequence = (range, now = new Date()) => {
    const { unit, points } = getRangeConfig(range);
    const anchor = new Date(now);

    if (unit === "hour") {
        anchor.setMinutes(0, 0, 0);
    } else if (unit === "day") {
        anchor.setHours(0, 0, 0, 0);
    } else {
        anchor.setHours(0, 0, 0, 0);
        anchor.setDate(1);
    }

    return Array.from({ length: points }, (_, index) => {
        const bucketDate = new Date(anchor);
        const offset = points - index - 1;

        if (unit === "hour") {
            bucketDate.setHours(bucketDate.getHours() - offset);
        } else if (unit === "day") {
            bucketDate.setDate(bucketDate.getDate() - offset);
        } else {
            bucketDate.setMonth(bucketDate.getMonth() - offset);
        }

        return {
            key: getBucketKey(bucketDate, unit),
            label: getBucketLabel(bucketDate, range, unit),
            date: bucketDate
        };
    });
};

const aggregateTimeline = async (Model, range, startDate, endDate, extraMatch = {}) => {
    const { groupFormat } = getRangeConfig(range);

    const results = await Model.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate },
                ...extraMatch
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format: groupFormat,
                        date: "$createdAt",
                        timezone: analyticsTimeZone
                    }
                },
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                key: "$_id",
                count: 1
            }
        },
        { $sort: { key: 1 } }
    ]);

    return new Map(results.map((item) => [item.key, item.count]));
};

export const getAdminStats = async (req, res) => {
    try {
        const range = supportedRanges.includes(req.query?.range) ? req.query.range : "1D";
        const now = new Date();
        const buckets = buildBucketSequence(range, now);
        const startDate = buckets[0]?.date || new Date(now);

        const [usersMap, bookingsMap, hospitalsMap, emergenciesMap, policeMap] = await Promise.all([
            aggregateTimeline(User, range, startDate, now, { role: 'user' }),
            aggregateTimeline(Booking, range, startDate, now),
            aggregateTimeline(User, range, startDate, now, { role: 'hospital' }),
            aggregateTimeline(Emergency, range, startDate, now),
            aggregateTimeline(User, range, startDate, now, { role: { $in: ['police', 'police_hq'] } })
        ]);

        const data = buckets.map((bucket) => ({
            label: bucket.label,
            users: usersMap.get(bucket.key) || 0,
            bookings: bookingsMap.get(bucket.key) || 0,
            hospitals: hospitalsMap.get(bucket.key) || 0,
            emergencies: emergenciesMap.get(bucket.key) || 0,
            police: policeMap.get(bucket.key) || 0
        }));

        return res.status(200).json({
            success: true,
            range,
            timeZone: analyticsTimeZone,
            data
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching admin stats",
            error: error.message
        });
    }
};

// Get all users
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password").sort({ createdAt: -1 });
        res.status(200).json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching users", error: error.message });
    }
};

export const createUser = async (req, res) => {
    try {
        const name = String(req.body?.name || "").trim();
        const email = String(req.body?.email || "").trim().toLowerCase();
        const password = String(req.body?.password || "");
        const role = String(req.body?.role || "user").trim().toLowerCase();
        const mobile = String(req.body?.mobile || "").trim();
        const address = String(req.body?.address || "").trim();
        const city = String(req.body?.city || "").trim();
        const vehicleNumber = String(req.body?.vehicleNumber || "").trim();
        const isEmailVerified = typeof req.body?.isEmailVerified === "boolean" ? req.body.isEmailVerified : true;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: "Name, email, and password are required" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: "Please provide a valid email address" });
        }

        if (password.length < 3) {
            return res.status(400).json({ success: false, message: "Password must be at least 3 characters long" });
        }

        if (!validRoles.includes(role)) {
            return res.status(400).json({ success: false, message: "Invalid role specified" });
        }

        if (!/^[6-9]\d{9}$/.test(mobile)) {
            return res.status(400).json({ success: false, message: "Please provide a valid 10-digit Indian mobile number" });
        }

        if (!address || !city) {
            return res.status(400).json({ success: false, message: "Address and city are required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ success: false, message: "A user with this email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            isEmailVerified,
            mobile,
            address,
            city,
            vehicleNumber
        });

        return res.status(201).json({
            success: true,
            message: "User added successfully",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                isEmailVerified: user.isEmailVerified,
                mobile: user.mobile,
                address: user.address,
                city: user.city,
                vehicleNumber: user.vehicleNumber
            }
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ success: false, message: "A user with this email already exists" });
        }

        return res.status(500).json({ success: false, message: "Error creating user", error: error.message });
    }
};

// Update User Role
export const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        
        if (!validRoles.includes(role)) {
            return res.status(400).json({ success: false, message: "Invalid role specified" });
        }

        const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select("-password");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        res.status(200).json({ success: true, message: "User role updated successfully", user });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating user role", error: error.message });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updatePayload = {};
        const allowedFields = ["name", "email", "mobile", "city", "address", "role", "vehicleNumber", "isEmailVerified"];

        for (const field of allowedFields) {
            if (typeof req.body[field] !== "undefined") {
                updatePayload[field] = req.body[field];
            }
        }

        if (!String(updatePayload.name || "").trim()) {
            return res.status(400).json({ success: false, message: "Name is required" });
        }

        if (!String(updatePayload.email || "").trim()) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updatePayload.email)) {
            return res.status(400).json({ success: false, message: "Please provide a valid email address" });
        }

        if (updatePayload.role && !validRoles.includes(updatePayload.role)) {
            return res.status(400).json({ success: false, message: "Invalid role specified" });
        }

        const existingUser = await User.findOne({ email: updatePayload.email, _id: { $ne: id } });
        if (existingUser) {
            return res.status(409).json({ success: false, message: "A user with this email already exists" });
        }

        updatePayload.updatedAt = new Date();

        const user = await User.findByIdAndUpdate(id, updatePayload, {
            new: true,
            runValidators: true
        }).select("-password");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({ success: true, message: "User updated successfully", user });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error updating user", error: error.message });
    }
};

// Get all emergencies
export const getAllEmergencies = async (req, res) => {
    try {
        const emergencies = await Emergency.find()
            .populate(emergencyPopulation)
            .sort({ createdAt: -1 });
            
        res.status(200).json({ success: true, emergencies });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching emergencies", error: error.message });
    }
};

export const getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate(bookingPopulation)
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching bookings", error: error.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user._id.toString() === id) {
            return res.status(400).json({ success: false, message: "You cannot delete your own admin account." });
        }

        const user = await User.findByIdAndDelete(id).select("-password");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        await Promise.all([
            Booking.deleteMany({ user: id }),
            Emergency.updateMany({ user: id }, { $unset: { user: 1 } }),
            Emergency.updateMany({ ambulance: id }, { $unset: { ambulance: 1 }, $set: { status: "PENDING" } })
        ]);

        res.status(200).json({ success: true, message: "User deleted successfully", user });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error deleting user", error: error.message });
    }
};

export const updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const validStatuses = ["PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid booking status" });
        }

        const booking = await Booking.findByIdAndUpdate(id, { status }, { new: true })
            .populate(bookingPopulation);

        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        res.status(200).json({ success: true, message: "Booking updated successfully", booking });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating booking", error: error.message });
    }
};

export const deleteBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await Booking.findByIdAndDelete(id);

        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        res.status(200).json({ success: true, message: "Booking deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error deleting booking", error: error.message });
    }
};

export const updateEmergencyStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const validStatuses = ["PENDING", "AMBULANCE_ACCEPTED", "COMPLETED", "CANCELLED"];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid emergency status" });
        }

        const update = { status };
        if (status === "PENDING") {
            update.ambulance = null;
        }

        const emergency = await Emergency.findByIdAndUpdate(id, update, { new: true })
            .populate(emergencyPopulation);

        if (!emergency) {
            return res.status(404).json({ success: false, message: "Emergency not found" });
        }

        res.status(200).json({ success: true, message: "Emergency updated successfully", emergency });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating emergency", error: error.message });
    }
};

export const deleteEmergency = async (req, res) => {
    try {
        const { id } = req.params;
        const emergency = await Emergency.findByIdAndDelete(id);

        if (!emergency) {
            return res.status(404).json({ success: false, message: "Emergency not found" });
        }

        res.status(200).json({ success: true, message: "Emergency deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error deleting emergency", error: error.message });
    }
};
