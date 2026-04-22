import Emergency from "../models/emergencyrequest.model.js";
import Police from "../models/police.model.js";

const isValidEmail = (email) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email);

const validatePolicePayload = (payload, isPartial = false) => {
    const requiredFields = ["name", "station", "contact", "email"];

    for (const field of requiredFields) {
        if (!isPartial && !String(payload[field] || "").trim()) {
            return `${field} is required`;
        }
    }

    if (payload.email && !isValidEmail(payload.email)) {
        return "Please provide a valid email address";
    }

    return null;
};

// Fetch Active System Emergencies for Police Command Center
export const getActiveEmergencies = async (req, res) => {
    try {
        const query = {
            status: { $in: ["PENDING", "AMBULANCE_ACCEPTED"] }
        };

        // If the user is a standard police station (field unit), restrict to 24h recent cases.
        // If they are police_hq, let them see everything.
        if (req.user.role === "police") {
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            query.createdAt = { $gte: oneDayAgo };
        }

        const emergencies = await Emergency.find(query)
        .populate("user", "name mobile")
        .populate("ambulance", "name mobile vehicleNumber")
        .populate("hospital", "name location contact email")
        .sort({ createdAt: -1 });

        res.status(200).json({ success: true, emergencies });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching emergencies", error: error.message });
    }
};

// Fetch ALL emergencies as police cases (all statuses)
export const getPoliceCases = async (req, res) => {
    try {
        const query = {};

        // Standard police stations see only last 7 days; police_hq sees everything
        if (req.user.role === "police") {
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            query.createdAt = { $gte: sevenDaysAgo };
        }

        const cases = await Emergency.find(query)
            .populate("user", "name mobile email address city")
            .populate("ambulance", "name mobile vehicleNumber")
            .populate("hospital", "name location contact email")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, cases });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching police cases", error: error.message });
    }
};

// Update case status from police dashboard
export const updateCaseStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ["PENDING", "AMBULANCE_ACCEPTED", "COMPLETED", "CANCELLED"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
        }

        const updated = await Emergency.findByIdAndUpdate(id, { status }, { new: true })
            .populate("user", "name mobile email address city")
            .populate("ambulance", "name mobile vehicleNumber")
            .populate("hospital", "name location contact email");

        if (!updated) {
            return res.status(404).json({ success: false, message: "Case not found" });
        }

        return res.status(200).json({ success: true, message: "Case status updated", case: updated });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error updating case status", error: error.message });
    }
};

export const getPoliceRecords = async (req, res) => {
    try {
        const police = await Police.find().sort({ createdAt: -1 });
        return res.status(200).json({ success: true, police });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error fetching police records", error: error.message });
    }
};

export const getPoliceById = async (req, res) => {
    try {
        const police = await Police.findById(req.params.id);

        if (!police) {
            return res.status(404).json({ success: false, message: "Police record not found" });
        }

        return res.status(200).json({ success: true, police });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error fetching police record", error: error.message });
    }
};

export const createPoliceRecord = async (req, res) => {
    try {
        const validationError = validatePolicePayload(req.body);
        if (validationError) {
            return res.status(400).json({ success: false, message: validationError });
        }

        const police = await Police.create({
            name: req.body.name,
            station: req.body.station,
            contact: req.body.contact,
            email: req.body.email,
        });

        return res.status(201).json({ success: true, message: "Police record created successfully", police });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error creating police record", error: error.message });
    }
};

export const updatePoliceRecord = async (req, res) => {
    try {
        const validationError = validatePolicePayload(req.body, true);
        if (validationError) {
            return res.status(400).json({ success: false, message: validationError });
        }

        const updatePayload = {};
        for (const field of ["name", "station", "contact", "email"]) {
            if (typeof req.body[field] !== "undefined") {
                updatePayload[field] = req.body[field];
            }
        }

        const police = await Police.findByIdAndUpdate(req.params.id, updatePayload, {
            new: true,
            runValidators: true,
        });

        if (!police) {
            return res.status(404).json({ success: false, message: "Police record not found" });
        }

        return res.status(200).json({ success: true, message: "Police record updated successfully", police });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error updating police record", error: error.message });
    }
};

export const deletePoliceRecord = async (req, res) => {
    try {
        const police = await Police.findByIdAndDelete(req.params.id);

        if (!police) {
            return res.status(404).json({ success: false, message: "Police record not found" });
        }

        return res.status(200).json({ success: true, message: "Police record deleted successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error deleting police record", error: error.message });
    }
};
