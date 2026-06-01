import { Pool } from "pg";
import { User, RescueTeam, Ticket, TicketHistory, Donation, TicketStatus } from "./types";
import fs from "fs";
import path from "path";
import dns from "dns";

// Force Node to prefer IPv4 DNS resolution (resolves ETIMEDOUT connection hangs on macOS dual-stack hosts)
if (dns && dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/hindu_foundation",
  connectionTimeoutMillis: 5000, // Socket connection timeout after 5 seconds to prevent locking requests
});

const JSON_DB_PATH = path.join(process.cwd(), "database.json");
export let useLocalJson = false;

function readLocalJsonDb(): any {
  try {
    if (!fs.existsSync(JSON_DB_PATH)) {
      return { users: [], rescueTeams: [], tickets: [], ticketHistories: [], donations: [] };
    }
    const data = fs.readFileSync(JSON_DB_PATH, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Failed to read local JSON database:", err);
    return { users: [], rescueTeams: [], tickets: [], ticketHistories: [], donations: [] };
  }
}

function writeLocalJsonDb(db: any): void {
  try {
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(db, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write to local JSON database:", err);
  }
}

let initPromise: Promise<void> | null = null;

export async function ensureDbInit(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        console.log("Probing cloud PostgreSQL database connection...");
        const client = await pool.connect();
        client.release();
        console.log("PostgreSQL connection succeeded! Using cloud database.");

        // 1. Create tables in proper constraint order
        await pool.query(`
          CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(50) PRIMARY KEY,
            role VARCHAR(20) NOT NULL,
            mobile VARCHAR(20) NOT NULL UNIQUE,
            name VARCHAR(100) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          );
        `);

        await pool.query(`
          CREATE TABLE IF NOT EXISTS rescue_teams (
            id VARCHAR(50) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            mobile VARCHAR(20) NOT NULL UNIQUE,
            city VARCHAR(100) NOT NULL,
            state VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'Active',
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          );
        `);

        await pool.query(`
          CREATE TABLE IF NOT EXISTS tickets (
            id VARCHAR(50) PRIMARY KEY,
            event_id VARCHAR(50) NOT NULL DEFAULT '112',
            animal_type VARCHAR(50) NOT NULL,
            custom_animal_type VARCHAR(100),
            description TEXT NOT NULL,
            image_url VARCHAR(255) NOT NULL,
            video_url VARCHAR(255) NOT NULL,
            latitude DOUBLE PRECISION NOT NULL,
            longitude DOUBLE PRECISION NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'Pending',
            assigned_rescue_team_id VARCHAR(50) REFERENCES rescue_teams(id) ON DELETE SET NULL,
            assigned_rescue_team_name VARCHAR(100),
            created_by VARCHAR(100) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
            accepted_at TIMESTAMP,
            closed_at TIMESTAMP,
            closure_reason VARCHAR(100),
            closure_description TEXT,
            closure_photo_url VARCHAR(255),
            pending_remarks TEXT
          );
        `);

        await pool.query(`
          CREATE TABLE IF NOT EXISTS ticket_histories (
            id VARCHAR(50) PRIMARY KEY,
            ticket_id VARCHAR(50) NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
            status VARCHAR(20) NOT NULL,
            remarks TEXT NOT NULL,
            updated_by VARCHAR(100) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          );
        `);

        await pool.query(`
          CREATE TABLE IF NOT EXISTS donations (
            id VARCHAR(50) PRIMARY KEY,
            donor_name VARCHAR(100) NOT NULL,
            mobile VARCHAR(20) NOT NULL,
            amount DOUBLE PRECISION NOT NULL,
            payment_mode VARCHAR(50) NOT NULL,
            transaction_id VARCHAR(100) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          );
        `);

        // Migration queries to support offline transaction verification proofs
        await pool.query("ALTER TABLE donations ADD COLUMN IF NOT EXISTS email VARCHAR(100)");
        await pool.query("ALTER TABLE donations ADD COLUMN IF NOT EXISTS purpose VARCHAR(100)");
        await pool.query("ALTER TABLE donations ADD COLUMN IF NOT EXISTS screenshot_url VARCHAR(255)");
        await pool.query("ALTER TABLE donations ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Verified'");

        // 2. Seed Default Users if empty
        const userCountRes = await pool.query("SELECT COUNT(*) FROM users");
        if (parseInt(userCountRes.rows[0].count, 10) === 0) {
          console.log("Seeding default users...");
          await pool.query(`
            INSERT INTO users (id, role, mobile, name, created_at) VALUES
            ('admin-1', 'admin', '9999999999', 'Admin Sharma', NOW() - INTERVAL '30 days'),
            ('team-1-user', 'team', '8888888888', 'Varanasi Animal Relief', NOW() - INTERVAL '25 days'),
            ('user-1', 'user', '7777777777', 'Ganesh Sharma', NOW() - INTERVAL '20 days')
          `);
        }

        // 3. Seed Default Rescue Teams if empty
        const teamCountRes = await pool.query("SELECT COUNT(*) FROM rescue_teams");
        if (parseInt(teamCountRes.rows[0].count, 10) === 0) {
          console.log("Seeding default rescue teams...");
          await pool.query(`
            INSERT INTO rescue_teams (id, name, mobile, city, state, email, status, created_at) VALUES
            ('team-1', 'Varanasi Animal Relief', '8888888888', 'Varanasi', 'Uttar Pradesh', 'varanasi.rescue@hindufoundation.org', 'Active', NOW() - INTERVAL '25 days'),
            ('team-2', 'Ayodhya Gau Sewa Dal', '8888811111', 'Ayodhya', 'Uttar Pradesh', 'ayodhya.gau@hindufoundation.org', 'Active', NOW() - INTERVAL '15 days'),
            ('team-3', 'Mathura Bird Care', '8888822222', 'Mathura', 'Uttar Pradesh', 'mathura.birds@hindufoundation.org', 'Active', NOW() - INTERVAL '10 days')
          `);
        }

        // 4. Seed Default Tickets if empty
        const ticketCountRes = await pool.query("SELECT COUNT(*) FROM tickets");
        if (parseInt(ticketCountRes.rows[0].count, 10) === 0) {
          console.log("Seeding default tickets...");
          // Ticket 1 (Closed)
          await pool.query(`
            INSERT INTO tickets (
              id, event_id, animal_type, description, image_url, video_url, latitude, longitude,
              status, assigned_rescue_team_id, assigned_rescue_team_name, created_by, created_at, updated_at,
              accepted_at, closed_at, closure_reason, closure_description, closure_photo_url
            ) VALUES (
              'TKT-1001', '112', 'Cow', 'Found an injured cow on the highway side near Bypass toll plaza. The cow has a fractured leg and needs immediate medical transit.',
              'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?q=80&w=600&auto=format&fit=crop', '', 25.3176, 82.9739,
              'Closed', 'team-1', 'Varanasi Animal Relief', 'Ganesh Sharma', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '4 hours',
              NOW() - INTERVAL '3 days' + INTERVAL '1 hour', NOW() - INTERVAL '3 days' + INTERVAL '4 hours',
              'Sent To Gaushala', 'Cow has been bandaged, loaded into cattle ambulance, and securely admitted to Shree Krishna Gaushala for rehab.',
              'https://images.unsplash.com/photo-1596733430284-f7437764b1a9?q=80&w=600&auto=format&fit=crop'
            )
          `);

          // Ticket 2 (Accepted)
          await pool.query(`
            INSERT INTO tickets (
              id, event_id, animal_type, description, image_url, video_url, latitude, longitude,
              status, assigned_rescue_team_id, assigned_rescue_team_name, created_by, created_at, updated_at, accepted_at
            ) VALUES (
              'TKT-1002', '112', 'Dog', 'Stray dog with deep neck wound due to metal wire. Located opposite Baba Vishwanath Mandir Parking.',
              'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=600&auto=format&fit=crop', '', 25.3109, 83.0105,
              'Accepted', 'team-1', 'Varanasi Animal Relief', 'Anonymous Reporter', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '45 minutes'
            )
          `);

          // Ticket 3 (Pending)
          await pool.query(`
            INSERT INTO tickets (
              id, event_id, animal_type, description, image_url, video_url, latitude, longitude,
              status, created_by, created_at, updated_at
            ) VALUES (
              'TKT-1003', '112', 'Bird', 'Dehydrated pigeon unable to fly. Hanging on balcony, looks very weak.',
              'https://images.unsplash.com/photo-1522441815192-d9f04eb0615c?q=80&w=600&auto=format&fit=crop', '', 26.8467, 80.9462,
              'Pending', 'Ramesh Patel', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours'
            )
          `);

          // Seed default ticket histories
          await pool.query(`
            INSERT INTO ticket_histories (id, ticket_id, status, remarks, updated_by, created_at) VALUES
            ('H-1', 'TKT-1001', 'Pending', 'Ticket created by Ganesh Sharma (7777777777).', 'Ganesh Sharma', NOW() - INTERVAL '3 days'),
            ('H-2', 'TKT-1001', 'Accepted', 'Rescue ticket accepted by Varanasi Animal Relief.', 'Varanasi Animal Relief', NOW() - INTERVAL '3 days' + INTERVAL '1 hour'),
            ('H-3', 'TKT-1001', 'Closed', 'Case resolved. Reason: Sent To Gaushala.', 'Varanasi Animal Relief', NOW() - INTERVAL '3 days' + INTERVAL '4 hours'),
            ('H-4', 'TKT-1002', 'Pending', 'Ticket created.', 'Reporter', NOW() - INTERVAL '1 hour'),
            ('H-5', 'TKT-1002', 'Accepted', 'Ticket accepted for emergency medical aid.', 'Varanasi Animal Relief', NOW() - INTERVAL '45 minutes'),
            ('H-6', 'TKT-1003', 'Pending', 'Ticket created. Waiting for nearby rescue team allocation.', 'Ramesh Patel', NOW() - INTERVAL '4 hours')
          `);
        }

        // 5. Seed Default Donations if empty
        const donationCountRes = await pool.query("SELECT COUNT(*) FROM donations");
        if (parseInt(donationCountRes.rows[0].count, 10) === 0) {
          console.log("Seeding default donations...");
          await pool.query(`
            INSERT INTO donations (id, donor_name, mobile, amount, payment_mode, transaction_id, created_at) VALUES
            ('DON-2001', 'Anand Mahindra', '9988776655', 51000, 'Razorpay Online', 'pay_xyz123456789', NOW() - INTERVAL '15 days'),
            ('DON-2002', 'Aditi Roy', '9876543210', 5000, 'UPI QR', 'upi_rrn998877661', NOW() - INTERVAL '10 days'),
            ('DON-2003', 'Keshav Das', '9123456789', 11000, 'UPI QR', 'upi_rrn998877662', NOW() - INTERVAL '5 days'),
            ('DON-2004', 'Meera Nair', '9812739182', 2500, 'Razorpay Online', 'pay_abc987654321', NOW() - INTERVAL '1 day')
          `);
        }

      } catch (err: any) {
        console.warn(
          "⚠️ PostgreSQL database connection failed/timed out. Falling back to offline local JSON database (database.json).",
          "Error detail:", err.message
        );
        useLocalJson = true;
      }
    })();
  }
  return initPromise;
}

// --- OBJECT MAPPER UTILITIES ---

function mapUser(row: any): User {
  return {
    id: row.id,
    role: row.role as any,
    mobile: row.mobile,
    name: row.name,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : "",
  };
}

function mapRescueTeam(row: any): RescueTeam {
  return {
    id: row.id,
    name: row.name,
    mobile: row.mobile,
    city: row.city,
    state: row.state,
    email: row.email,
    status: row.status as any,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : "",
  };
}

function mapTicket(row: any): Ticket {
  return {
    id: row.id,
    eventId: row.event_id,
    animalType: row.animal_type,
    customAnimalType: row.custom_animal_type || undefined,
    description: row.description,
    imageUrl: row.image_url,
    videoUrl: row.video_url,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    status: row.status as any,
    assignedRescueTeamId: row.assigned_rescue_team_id || undefined,
    assignedRescueTeamName: row.assigned_rescue_team_name || undefined,
    createdBy: row.created_by,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : "",
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : "",
    acceptedAt: row.accepted_at ? new Date(row.accepted_at).toISOString() : undefined,
    closedAt: row.closed_at ? new Date(row.closed_at).toISOString() : undefined,
    closureReason: row.closure_reason || undefined,
    closureDescription: row.closure_description || undefined,
    closurePhotoUrl: row.closure_photo_url || undefined,
    pendingRemarks: row.pending_remarks || undefined,
  };
}

function mapTicketHistory(row: any): TicketHistory {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    status: row.status as any,
    remarks: row.remarks,
    updatedBy: row.updated_by,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : "",
  };
}

function mapDonation(row: any): Donation {
  return {
    id: row.id,
    donorName: row.donor_name,
    mobile: row.mobile,
    amount: Number(row.amount),
    paymentMode: row.payment_mode,
    transactionId: row.transaction_id,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : "",
    email: row.email || undefined,
    purpose: row.purpose || undefined,
    screenshotUrl: row.screenshot_url || undefined,
    status: row.status || undefined,
  };
}

// --- DATABASE SERVICE IMPLEMENTATION ---

export const dbService = {
  // --- USERS ---
  async getUsers(): Promise<User[]> {
    await ensureDbInit();
    if (useLocalJson) {
      const db = readLocalJsonDb();
      return db.users || [];
    }
    const res = await pool.query("SELECT * FROM users ORDER BY created_at DESC");
    return res.rows.map(mapUser);
  },

  async findUserByMobile(mobile: string): Promise<User | undefined> {
    await ensureDbInit();
    if (useLocalJson) {
      const db = readLocalJsonDb();
      return (db.users || []).find((u: any) => u.mobile === mobile);
    }
    const res = await pool.query("SELECT * FROM users WHERE mobile = $1", [mobile]);
    if ((res.rowCount ?? 0) === 0) return undefined;
    return mapUser(res.rows[0]);
  },

  async createUser(user: Omit<User, "id" | "createdAt">): Promise<User> {
    await ensureDbInit();
    if (useLocalJson) {
      const db = readLocalJsonDb();
      const newId = `USR-${Math.floor(1000 + Math.random() * 9000)}`;
      const now = new Date().toISOString();
      const newUser: User = {
        id: newId,
        role: user.role,
        mobile: user.mobile,
        name: user.name,
        createdAt: now,
      };
      db.users = db.users || [];
      db.users.push(newUser);
      writeLocalJsonDb(db);
      return newUser;
    }
    const newId = `USR-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const res = await pool.query(
      "INSERT INTO users (id, role, mobile, name, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [newId, user.role, user.mobile, user.name, now]
    );
    return mapUser(res.rows[0]);
  },

  // --- RESCUE TEAMS ---
  async getRescueTeams(): Promise<RescueTeam[]> {
    await ensureDbInit();
    if (useLocalJson) {
      const db = readLocalJsonDb();
      return db.rescueTeams || [];
    }
    const res = await pool.query("SELECT * FROM rescue_teams ORDER BY created_at DESC");
    return res.rows.map(mapRescueTeam);
  },

  async createRescueTeam(team: Omit<RescueTeam, "id" | "createdAt">): Promise<RescueTeam> {
    await ensureDbInit();
    if (useLocalJson) {
      const db = readLocalJsonDb();
      const newId = `TEAM-${Math.floor(100 + Math.random() * 900)}`;
      const now = new Date().toISOString();
      const newTeam: RescueTeam = {
        id: newId,
        name: team.name,
        mobile: team.mobile,
        city: team.city,
        state: team.state,
        email: team.email,
        status: team.status || "Active",
        createdAt: now,
      };
      db.rescueTeams = db.rescueTeams || [];
      db.rescueTeams.push(newTeam);
      writeLocalJsonDb(db);
      return newTeam;
    }
    const newId = `TEAM-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date();
    const res = await pool.query(
      "INSERT INTO rescue_teams (id, name, mobile, city, state, email, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [newId, team.name, team.mobile, team.city, team.state, team.email, team.status || "Active", now]
    );
    return mapRescueTeam(res.rows[0]);
  },

  async updateRescueTeam(id: string, updates: Partial<Omit<RescueTeam, "id" | "createdAt">>): Promise<RescueTeam | undefined> {
    await ensureDbInit();
    if (useLocalJson) {
      const db = readLocalJsonDb();
      const idx = (db.rescueTeams || []).findIndex((t: any) => t.id === id);
      if (idx === -1) return undefined;
      const updated = { ...db.rescueTeams[idx], ...updates };
      db.rescueTeams[idx] = updated;
      writeLocalJsonDb(db);
      return updated;
    }
    const fields = Object.keys(updates);
    if (fields.length === 0) {
      const res = await pool.query("SELECT * FROM rescue_teams WHERE id = $1", [id]);
      return (res.rowCount ?? 0) > 0 ? mapRescueTeam(res.rows[0]) : undefined;
    }
    const setClauses: string[] = [];
    const values: any[] = [id];
    let argIndex = 2;

    for (const field of fields) {
      const colName = field === "createdAt" ? "created_at" : field;
      setClauses.push(`${colName} = $${argIndex}`);
      values.push((updates as any)[field]);
      argIndex++;
    }

    const res = await pool.query(
      `UPDATE rescue_teams SET ${setClauses.join(", ")} WHERE id = $1 RETURNING *`,
      values
    );
    if ((res.rowCount ?? 0) === 0) return undefined;
    return mapRescueTeam(res.rows[0]);
  },

  async deleteRescueTeam(id: string): Promise<boolean> {
    await ensureDbInit();
    if (useLocalJson) {
      const db = readLocalJsonDb();
      const initialLength = (db.rescueTeams || []).length;
      db.rescueTeams = (db.rescueTeams || []).filter((t: any) => t.id !== id);
      writeLocalJsonDb(db);
      return db.rescueTeams.length < initialLength;
    }
    const res = await pool.query("DELETE FROM rescue_teams WHERE id = $1", [id]);
    return (res.rowCount ?? 0) > 0;
  },

  // --- TICKETS ---
  async getTickets(): Promise<Ticket[]> {
    await ensureDbInit();
    if (useLocalJson) {
      const db = readLocalJsonDb();
      const tickets = db.tickets || [];
      const now = new Date();
      const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
      let updated = false;

      tickets.forEach((t: any) => {
        if (t.status === "Accepted" && t.acceptedAt && new Date(t.acceptedAt) <= threeHoursAgo) {
          t.status = "Pending";
          t.pendingRemarks = "System Auto-Revert: No action taken within 3 hours.";
          t.assignedRescueTeamId = undefined;
          t.assignedRescueTeamName = undefined;
          t.updatedAt = now.toISOString();

          db.ticketHistories = db.ticketHistories || [];
          db.ticketHistories.push({
            id: `H-${Math.floor(10000 + Math.random() * 90000)}`,
            ticketId: t.id,
            status: "Pending",
            remarks: "Auto-reverted to Pending: Rescue team failed to take action within 3 hours limit.",
            updatedBy: "System Daemon",
            createdAt: now.toISOString(),
          });
          updated = true;
        }
      });

      if (updated) {
        writeLocalJsonDb(db);
      }

      return [...tickets].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    
    // Simulate auto-pending rule: if a ticket remains "Accepted" for > 3 hours, revert to "Pending"
    const staleTicketsRes = await pool.query(
      "SELECT * FROM tickets WHERE status = 'Accepted' AND accepted_at <= $1",
      [threeHoursAgo]
    );

    if (staleTicketsRes.rowCount && staleTicketsRes.rowCount > 0) {
      for (const t of staleTicketsRes.rows) {
        const historyId = `H-${Math.floor(10000 + Math.random() * 90000)}`;
        await pool.query(
          "INSERT INTO ticket_histories (id, ticket_id, status, remarks, updated_by, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
          [
            historyId,
            t.id,
            "Pending",
            "Auto-reverted to Pending: Rescue team failed to take action within 3 hours limit.",
            "System Daemon",
            now,
          ]
        );
        await pool.query(
          "UPDATE tickets SET status = 'Pending', pending_remarks = 'System Auto-Revert: No action taken within 3 hours.', assigned_rescue_team_id = NULL, assigned_rescue_team_name = NULL, updated_at = $2 WHERE id = $1",
          [t.id, now]
        );
      }
    }

    const res = await pool.query("SELECT * FROM tickets ORDER BY created_at DESC");
    return res.rows.map(mapTicket);
  },

  async getTicketById(id: string): Promise<Ticket | undefined> {
    await ensureDbInit();
    if (useLocalJson) {
      const db = readLocalJsonDb();
      return (db.tickets || []).find((t: any) => t.id === id);
    }
    const res = await pool.query("SELECT * FROM tickets WHERE id = $1", [id]);
    if ((res.rowCount ?? 0) === 0) return undefined;
    return mapTicket(res.rows[0]);
  },

  async createTicket(ticket: Omit<Ticket, "id" | "status" | "createdAt" | "updatedAt">): Promise<Ticket> {
    await ensureDbInit();
    if (useLocalJson) {
      const db = readLocalJsonDb();
      const newId = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
      const now = new Date().toISOString();
      const newTicket: Ticket = {
        id: newId,
        eventId: ticket.eventId || "112",
        animalType: ticket.animalType,
        customAnimalType: ticket.customAnimalType || undefined,
        description: ticket.description,
        imageUrl: ticket.imageUrl,
        videoUrl: ticket.videoUrl,
        latitude: Number(ticket.latitude),
        longitude: Number(ticket.longitude),
        status: "Pending",
        assignedRescueTeamId: ticket.assignedRescueTeamId || undefined,
        assignedRescueTeamName: ticket.assignedRescueTeamName || undefined,
        createdBy: ticket.createdBy || "Citizen Reporter",
        createdAt: now,
        updatedAt: now,
      };

      db.tickets = db.tickets || [];
      db.tickets.push(newTicket);

      db.ticketHistories = db.ticketHistories || [];
      db.ticketHistories.push({
        id: `H-${Math.floor(10000 + Math.random() * 90000)}`,
        ticketId: newId,
        status: "Pending",
        remarks: `Emergency Rescue case reported for ${ticket.animalType}. Event ID: 112.`,
        updatedBy: ticket.createdBy || "Citizen Reporter",
        createdAt: now,
      });

      writeLocalJsonDb(db);
      return newTicket;
    }

    const newId = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    
    const res = await pool.query(
      `INSERT INTO tickets (
        id, event_id, animal_type, custom_animal_type, description, image_url, video_url,
        latitude, longitude, status, assigned_rescue_team_id, assigned_rescue_team_name,
        created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [
        newId,
        ticket.eventId || "112",
        ticket.animalType,
        ticket.customAnimalType || null,
        ticket.description,
        ticket.imageUrl,
        ticket.videoUrl,
        ticket.latitude,
        ticket.longitude,
        "Pending",
        ticket.assignedRescueTeamId || null,
        ticket.assignedRescueTeamName || null,
        ticket.createdBy || "Citizen Reporter",
        now,
        now,
      ]
    );

    const historyId = `H-${Math.floor(10000 + Math.random() * 90000)}`;
    await pool.query(
      "INSERT INTO ticket_histories (id, ticket_id, status, remarks, updated_by, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        historyId,
        newId,
        "Pending",
        `Emergency Rescue case reported for ${ticket.animalType}. Event ID: 112.`,
        ticket.createdBy || "Citizen Reporter",
        now,
      ]
    );

    return mapTicket(res.rows[0]);
  },

  async updateTicketStatus(
    id: string,
    status: TicketStatus,
    updaterName: string,
    remarks: string,
    additionalFields: Partial<Ticket> = {}
  ): Promise<Ticket | undefined> {
    await ensureDbInit();
    if (useLocalJson) {
      const db = readLocalJsonDb();
      const idx = (db.tickets || []).findIndex((t: any) => t.id === id);
      if (idx === -1) return undefined;
      
      const now = new Date().toISOString();
      const ticket = db.tickets[idx];
      
      const updatedTicket = {
        ...ticket,
        status,
        remarks,
        updatedAt: now,
        ...additionalFields,
      };

      if (status === "Accepted") {
        updatedTicket.acceptedAt = now;
      } else if (status === "Closed") {
        updatedTicket.closedAt = now;
      }

      db.tickets[idx] = updatedTicket;

      db.ticketHistories = db.ticketHistories || [];
      db.ticketHistories.push({
        id: `H-${Math.floor(10000 + Math.random() * 90000)}`,
        ticketId: id,
        status,
        remarks,
        updatedBy: updaterName,
        createdAt: now,
      });

      writeLocalJsonDb(db);
      return updatedTicket;
    }

    const now = new Date();
    
    const originalRes = await pool.query("SELECT * FROM tickets WHERE id = $1", [id]);
    if ((originalRes.rowCount ?? 0) === 0) return undefined;

    const allowedFields = [
      "assignedRescueTeamId",
      "assignedRescueTeamName",
      "closureReason",
      "closureDescription",
      "closurePhotoUrl",
      "pendingRemarks"
    ];

    const setClauses: string[] = ["status = $2", "updated_at = $3"];
    const values: any[] = [id, status, now];

    if (status === "Accepted") {
      setClauses.push("accepted_at = $4");
      values.push(now);
    } else if (status === "Closed") {
      setClauses.push("closed_at = $4");
      values.push(now);
    }

    let argIndex = values.length + 1;
    for (const key of Object.keys(additionalFields)) {
      if (allowedFields.includes(key)) {
        const colName = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        setClauses.push(`${colName} = $${argIndex}`);
        values.push((additionalFields as any)[key]);
        argIndex++;
      }
    }

    const res = await pool.query(
      `UPDATE tickets SET ${setClauses.join(", ")} WHERE id = $1 RETURNING *`,
      values
    );
    if ((res.rowCount ?? 0) === 0) return undefined;

    const historyId = `H-${Math.floor(10000 + Math.random() * 90000)}`;
    await pool.query(
      "INSERT INTO ticket_histories (id, ticket_id, status, remarks, updated_by, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
      [historyId, id, status, remarks, updaterName, now]
    );

    return mapTicket(res.rows[0]);
  },

  async getTicketHistory(ticketId: string): Promise<TicketHistory[]> {
    await ensureDbInit();
    if (useLocalJson) {
      const db = readLocalJsonDb();
      return (db.ticketHistories || [])
        .filter((h: any) => h.ticketId === ticketId)
        .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    const res = await pool.query(
      "SELECT * FROM ticket_histories WHERE ticket_id = $1 ORDER BY created_at ASC",
      [ticketId]
    );
    return res.rows.map(mapTicketHistory);
  },

  // --- DONATIONS ---
  async getDonations(): Promise<Donation[]> {
    await ensureDbInit();
    if (useLocalJson) {
      const db = readLocalJsonDb();
      return db.donations || [];
    }
    const res = await pool.query("SELECT * FROM donations ORDER BY created_at DESC");
    return res.rows.map(mapDonation);
  },

  async createDonation(donation: Omit<Donation, "id" | "createdAt">): Promise<Donation> {
    await ensureDbInit();
    if (useLocalJson) {
      const db = readLocalJsonDb();
      const newId = `DON-${Math.floor(2000 + Math.random() * 8000)}`;
      const now = new Date().toISOString();
      const newDonation: Donation = {
        id: newId,
        donorName: donation.donorName,
        mobile: donation.mobile,
        amount: Number(donation.amount),
        paymentMode: donation.paymentMode,
        transactionId: donation.transactionId,
        createdAt: now,
        email: donation.email || undefined,
        purpose: donation.purpose || undefined,
        screenshotUrl: donation.screenshotUrl || undefined,
        status: donation.status || "Verified",
      };

      db.donations = db.donations || [];
      db.donations.push(newDonation);
      writeLocalJsonDb(db);
      return newDonation;
    }

    const newId = `DON-${Math.floor(2000 + Math.random() * 8000)}`;
    const now = new Date();
    const res = await pool.query(
      "INSERT INTO donations (id, donor_name, mobile, amount, payment_mode, transaction_id, created_at, email, purpose, screenshot_url, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *",
      [
        newId,
        donation.donorName,
        donation.mobile,
        donation.amount,
        donation.paymentMode,
        donation.transactionId,
        now,
        donation.email || null,
        donation.purpose || null,
        donation.screenshotUrl || null,
        donation.status || "Verified",
      ]
    );
    return mapDonation(res.rows[0]);
  },

  async updateDonationStatusAndAmount(id: string, status: string, amount?: number): Promise<Donation | undefined> {
    await ensureDbInit();
    if (useLocalJson) {
      const db = readLocalJsonDb();
      const idx = (db.donations || []).findIndex((d: any) => d.id === id);
      if (idx === -1) return undefined;
      
      const updated: any = { ...db.donations[idx], status };
      if (amount !== undefined && amount !== null) {
        updated.amount = Number(amount);
      }
      db.donations[idx] = updated;
      writeLocalJsonDb(db);
      return updated;
    }

    let res;
    if (amount !== undefined && amount !== null) {
      res = await pool.query(
        "UPDATE donations SET status = $2, amount = $3 WHERE id = $1 RETURNING *",
        [id, status, amount]
      );
    } else {
      res = await pool.query(
        "UPDATE donations SET status = $2 WHERE id = $1 RETURNING *",
        [id, status]
      );
    }
    if ((res.rowCount ?? 0) === 0) return undefined;
    return mapDonation(res.rows[0]);
  },
};
