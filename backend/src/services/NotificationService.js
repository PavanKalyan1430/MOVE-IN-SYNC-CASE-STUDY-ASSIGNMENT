class NotificationService {
  static sendPickupArrivedNotification(tripId) {
    console.log("Pickup Arrived Notification Sent", { tripId });
  }

  static sendTripAutoCompletedNotification(tripId) {
    console.log("Trip Auto Completed", { tripId });
  }
}

module.exports = NotificationService;
