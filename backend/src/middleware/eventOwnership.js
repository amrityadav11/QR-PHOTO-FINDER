const { Event } = require('../models');
const { sendNotFound, sendForbidden } = require('../utils/apiResponse');

/**
 * Middleware: verify the authenticated user owns the event specified in :id or :eventId
 * Attaches event to req.event for downstream handlers.
 */
const requireEventOwnership = async (req, res, next) => {
  try {
    const eventId = req.params.id || req.params.eventId;

    const event = await Event.findById(eventId);

    if (!event) {
      return sendNotFound(res, 'Event not found.');
    }

    // Admin can access any event
    if (req.user.role === 'admin') {
      req.event = event;
      return next();
    }

    if (event.owner.toString() !== req.user._id.toString()) {
      return sendForbidden(res, 'You do not have permission to access this event.');
    }

    req.event = event;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { requireEventOwnership };
