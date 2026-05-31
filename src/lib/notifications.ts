import fs from "fs";
import path from "path";

const NOTIF_FILE = path.join(process.cwd(), "notifications.json");

export interface NotificationLog {
  id: string;
  recipientRole: "admin" | "team" | "user";
  recipientContact: string; // Phone number or "FCM Topic"
  method: "SMS" | "FCM Push" | "All";
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

function readNotifs(): NotificationLog[] {
  try {
    if (!fs.existsSync(NOTIF_FILE)) {
      fs.writeFileSync(NOTIF_FILE, JSON.stringify([], null, 2), "utf-8");
      return [];
    }
    return JSON.parse(fs.readFileSync(NOTIF_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function writeNotifs(logs: NotificationLog[]) {
  try {
    fs.writeFileSync(NOTIF_FILE, JSON.stringify(logs, null, 2), "utf-8");
  } catch {}
}

export const notificationService = {
  getNotifications(): NotificationLog[] {
    return readNotifs();
  },

  sendNotification(recipientRole: "admin" | "team" | "user", recipientContact: string, title: string, body: string, method: "SMS" | "FCM Push" | "All" = "All") {
    const logs = readNotifs();
    const newLog: NotificationLog = {
      id: `NTF-${Math.floor(10000 + Math.random() * 90000)}`,
      recipientRole,
      recipientContact,
      method,
      title,
      body,
      createdAt: new Date().toISOString(),
      read: false,
    };
    logs.unshift(newLog);
    // Keep max 100 notifications
    if (logs.length > 100) logs.pop();
    writeNotifs(logs);

    // Also log in console
    console.log(`[NOTIFICATION SENT] [${method}] [To: ${recipientRole} @ ${recipientContact}] Title: ${title} | Body: ${body}`);
    return newLog;
  },

  notifyTicketCreated(ticketId: string, animalType: string) {
    // Notify Admin
    this.sendNotification(
      "admin",
      "admin-fcm-topic",
      "🚨 New Animal Rescue Emergency!",
      `Ticket ${ticketId} has been created for an injured ${animalType}. Location coordinates captured. Needs team assignment.`,
      "FCM Push"
    );
    // Notify all Rescue Teams via SMS & FCM
    this.sendNotification(
      "team",
      "teams-broadcast-topic",
      "🚑 EMERGENCY: Rescue Case Alert!",
      `A new rescue ticket (${ticketId}) for a ${animalType} has been reported. Open your dashboard to view details and Accept Rescue!`,
      "All"
    );
  },

  notifyTicketAccepted(ticketId: string, animalType: string, teamName: string, userMobile: string) {
    // Notify Reporter (User)
    this.sendNotification(
      "user",
      userMobile,
      "✅ Rescue Team Dispatched!",
      `Great news! Your rescue ticket ${ticketId} for the ${animalType} has been accepted by "${teamName}". They are en-route now.`,
      "All"
    );
    // Notify Admin
    this.sendNotification(
      "admin",
      "admin-fcm-topic",
      "📋 Ticket Accepted",
      `Ticket ${ticketId} (${animalType}) has been accepted by Rescue Team: "${teamName}".`,
      "FCM Push"
    );
  },

  notifyTicketClosed(ticketId: string, animalType: string, reason: string, userMobile: string) {
    // Notify Reporter (User)
    this.sendNotification(
      "user",
      userMobile,
      "❤️ Rescue Operation Closed",
      `The rescue case ${ticketId} for the ${animalType} has been resolved successfully. Resolution: ${reason}. Thank you for your support!`,
      "All"
    );
  },
};
