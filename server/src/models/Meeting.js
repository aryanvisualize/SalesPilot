
import mongoose from "mongoose";


const visitSchema = new mongoose.Schema(
  {
    checkInAt: {
      type: Date,
      required: true,
    },

    checkOutAt: {
      type: Date,
      default: null,
    },

    checkInLocation: {
      latitude: Number,
      longitude: Number,
    },

    checkOutLocation: {
      latitude: Number,
      longitude: Number,
    },

    reasonForLeaving: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: true }
);


const reopenHistorySchema = new mongoose.Schema(
  {
    reopenedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    reopenedAt: {
      type: Date,
      required: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    previousOutcome: {
      type: String,
      default: null,
    },
  },
  { _id: true }
);


const meetingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    purpose: {
      type: String,
      required: true,
      trim: true,
    },

    scheduledStart: {
      type: Date,
      required: true,
    },

    scheduledEnd: {
      type: Date,
      required: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
    visits: {
      type: [visitSchema],
      default: [],
    },

    status: {
      type: String,
      enum: [
        "scheduled",
        "confirmed",
        "checked_in",
        "in_progress",
        "paused",
        "completed",
      ],
      default: "scheduled",
    },

    outcome: {
      type: String,
      enum: [
        "interested",
        "follow_up_required",
        "proposal_requested",
        "not_interested",
        "unable_to_meet",
      ],
      default: null,
    },
    reopenHistory: {
      type: [reopenHistorySchema],
      default: [],
    },
  },
  { timestamps: true }
);

meetingSchema.index({ assignedTo: 1, scheduledStart: 1 });

const Meeting = mongoose.model("Meeting", meetingSchema);

export default Meeting;
