
import mongoose from "mongoose";

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
  },
  { timestamps: true }
);

meetingSchema.index({ assignedTo: 1, scheduledStart: 1 });

const Meeting = mongoose.model("Meeting", meetingSchema);

export default Meeting;
