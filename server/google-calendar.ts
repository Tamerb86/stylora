import { google } from "googleapis";

/**
 * Google Calendar Integration Service
 * 
 * Syncs appointments with Google Calendar for customers and employees
 * Requires OAuth2 credentials configured in environment variables
 */

// Google Calendar credentials from environment
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/auth/google/callback";

let oauth2Client: any = null;

// Initialize OAuth2 client if credentials are available
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  try {
    oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );
    console.log("[Google Calendar] OAuth2 client initialized successfully");
  } catch (error) {
    console.error("[Google Calendar] Failed to initialize OAuth2 client:", error);
  }
} else {
  console.warn("[Google Calendar] Credentials not configured. Calendar sync will be skipped.");
}

/**
 * Generate OAuth2 authorization URL for user to grant calendar access
 */
export function getAuthorizationUrl(): string {
  if (!oauth2Client) {
    throw new Error("Google OAuth2 client not configured");
  }

  const scopes = [
    "https://www.googleapis.com/auth/calendar.events",
  ];

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
  });
}

/**
 * Exchange authorization code for access token
 */
export async function getTokenFromCode(code: string): Promise<any> {
  if (!oauth2Client) {
    throw new Error("Google OAuth2 client not configured");
  }

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
}

/**
 * Set credentials for OAuth2 client
 */
export function setCredentials(tokens: any): void {
  if (!oauth2Client) {
    throw new Error("Google OAuth2 client not configured");
  }
  oauth2Client.setCredentials(tokens);
}

/**
 * Create a calendar event
 * @param accessToken - User's Google Calendar access token
 * @param event - Event details
 * @returns Event ID from Google Calendar
 */
export async function createCalendarEvent(
  accessToken: string,
  event: {
    summary: string;
    description?: string;
    location?: string;
    start: Date;
    end: Date;
    attendees?: string[];
  }
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  if (!oauth2Client) {
    console.warn("[Google Calendar] OAuth2 client not configured, skipping event creation");
    return { success: false, error: "Google Calendar not configured" };
  }

  try {
    // Create a new OAuth2 client instance for this request
    const client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );
    client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth: client });

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: event.summary,
        description: event.description,
        location: event.location,
        start: {
          dateTime: event.start.toISOString(),
          timeZone: "Europe/Oslo",
        },
        end: {
          dateTime: event.end.toISOString(),
          timeZone: "Europe/Oslo",
        },
        attendees: event.attendees?.map((email) => ({ email })),
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 24 * 60 }, // 1 day before
            { method: "popup", minutes: 60 }, // 1 hour before
          ],
        },
      },
    });

    console.log(`[Google Calendar] Event created successfully: ${response.data.id}`);
    return {
      success: true,
      eventId: response.data.id || undefined,
    };
  } catch (error: any) {
    console.error("[Google Calendar] Failed to create event:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update a calendar event
 * @param accessToken - User's Google Calendar access token
 * @param eventId - Google Calendar event ID
 * @param event - Updated event details
 */
export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  event: {
    summary?: string;
    description?: string;
    location?: string;
    start?: Date;
    end?: Date;
    attendees?: string[];
  }
): Promise<{ success: boolean; error?: string }> {
  if (!oauth2Client) {
    console.warn("[Google Calendar] OAuth2 client not configured, skipping event update");
    return { success: false, error: "Google Calendar not configured" };
  }

  try {
    const client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );
    client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth: client });

    const updateData: any = {};
    if (event.summary) updateData.summary = event.summary;
    if (event.description) updateData.description = event.description;
    if (event.location) updateData.location = event.location;
    if (event.start) {
      updateData.start = {
        dateTime: event.start.toISOString(),
        timeZone: "Europe/Oslo",
      };
    }
    if (event.end) {
      updateData.end = {
        dateTime: event.end.toISOString(),
        timeZone: "Europe/Oslo",
      };
    }
    if (event.attendees) {
      updateData.attendees = event.attendees.map((email) => ({ email }));
    }

    await calendar.events.patch({
      calendarId: "primary",
      eventId,
      requestBody: updateData,
    });

    console.log(`[Google Calendar] Event updated successfully: ${eventId}`);
    return { success: true };
  } catch (error: any) {
    console.error("[Google Calendar] Failed to update event:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete a calendar event
 * @param accessToken - User's Google Calendar access token
 * @param eventId - Google Calendar event ID
 */
export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  if (!oauth2Client) {
    console.warn("[Google Calendar] OAuth2 client not configured, skipping event deletion");
    return { success: false, error: "Google Calendar not configured" };
  }

  try {
    const client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );
    client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth: client });

    await calendar.events.delete({
      calendarId: "primary",
      eventId,
    });

    console.log(`[Google Calendar] Event deleted successfully: ${eventId}`);
    return { success: true };
  } catch (error: any) {
    console.error("[Google Calendar] Failed to delete event:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Sync appointment to Google Calendar (create/update/delete)
 * @param appointment - Appointment details
 * @param action - Action to perform (create, update, delete)
 * @param accessToken - User's Google Calendar access token
 * @param existingEventId - Existing Google Calendar event ID (for update/delete)
 */
export async function syncAppointmentToCalendar(
  appointment: {
    id: number;
    customerName: string;
    employeeName: string;
    salonName: string;
    serviceName: string;
    appointmentDate: Date;
    startTime: string;
    endTime: string;
    notes?: string;
  },
  action: "create" | "update" | "delete",
  accessToken?: string,
  existingEventId?: string
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  if (!accessToken) {
    console.warn("[Google Calendar] No access token provided, skipping sync");
    return { success: false, error: "No access token" };
  }

  try {
    const startDateTime = new Date(appointment.appointmentDate);
    const [startHours, startMinutes] = appointment.startTime.split(":").map(Number);
    startDateTime.setHours(startHours, startMinutes, 0, 0);

    const endDateTime = new Date(appointment.appointmentDate);
    const [endHours, endMinutes] = appointment.endTime.split(":").map(Number);
    endDateTime.setHours(endHours, endMinutes, 0, 0);

    if (action === "create") {
      return await createCalendarEvent(accessToken, {
        summary: `${appointment.serviceName} - ${appointment.salonName}`,
        description: `Booking hos ${appointment.salonName}\n\nTjeneste: ${appointment.serviceName}\nAnsatt: ${appointment.employeeName}\n\n${appointment.notes || ""}`,
        location: appointment.salonName,
        start: startDateTime,
        end: endDateTime,
      });
    } else if (action === "update" && existingEventId) {
      return await updateCalendarEvent(accessToken, existingEventId, {
        summary: `${appointment.serviceName} - ${appointment.salonName}`,
        description: `Booking hos ${appointment.salonName}\n\nTjeneste: ${appointment.serviceName}\nAnsatt: ${appointment.employeeName}\n\n${appointment.notes || ""}`,
        location: appointment.salonName,
        start: startDateTime,
        end: endDateTime,
      });
    } else if (action === "delete" && existingEventId) {
      return await deleteCalendarEvent(accessToken, existingEventId);
    }

    return { success: false, error: "Invalid action or missing event ID" };
  } catch (error: any) {
    console.error("[Google Calendar] Sync failed:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}
