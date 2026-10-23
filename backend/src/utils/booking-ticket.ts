import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

export interface TicketPdfService {
  name: string;
  price: string;
  durationMin: number;
  startsAt: Date;
  endsAt: Date;
}

export interface TicketPdfData {
  reference: string;
  salonName: string;
  salonAddress: string;
  services: TicketPdfService[];
  timezone: string;
  ticketKey: string;
}

function getEncryptionKey(): Buffer {
  const value = process.env.BOOKING_TICKET_ENCRYPTION_KEY;

  if (!value || !/^[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error(
      "BOOKING_TICKET_ENCRYPTION_KEY must be a 32-byte key encoded as 64 hex characters",
    );
  }

  return Buffer.from(value, "hex");
}

const PAGE_WIDTH = 595.28; // A4, points
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const TEXT_COLOR = rgb(0, 0, 0);

export async function createTicketPdf(data: TicketPdfData): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page: PDFPage | undefined;
  let y = MARGIN;

  const addPage = () => {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = MARGIN;
  };

  const ensureSpace = (height: number) => {
    if (!page || y + height > PAGE_HEIGHT - MARGIN) {
      addPage();
    }
  };

  const drawLine = (
    text: string,
    options: {
      size: number;
      font?: PDFFont;
      align?: "left" | "center" | "right";
      gapAfter?: number;
      x?: number;
      width?: number;
    },
  ) => {
    const font = options.font ?? regular;
    const size = options.size;
    const x = options.x ?? MARGIN;
    const width = options.width ?? CONTENT_WIDTH;
    const textWidth = font.widthOfTextAtSize(text, size);
    const textX =
      options.align === "center"
        ? x + (width - textWidth) / 2
        : options.align === "right"
          ? x + width - textWidth
          : x;

    ensureSpace(size + (options.gapAfter ?? 0));
    page!.drawText(text, {
      x: textX,
      y: PAGE_HEIGHT - y - size,
      size,
      font,
      color: TEXT_COLOR,
    });
    y += size + (options.gapAfter ?? 0);
  };

  const drawWrapped = (
    text: string,
    options: {
      size: number;
      font?: PDFFont;
      gapAfter?: number;
      width?: number;
      x?: number;
    },
  ) => {
    const font = options.font ?? regular;
    const size = options.size;
    const width = options.width ?? CONTENT_WIDTH;
    const x = options.x ?? MARGIN;
    const lineHeight = size * 1.25;
    const words = text.split(/\s+/).filter(Boolean);
    let line = "";

    if (words.length === 0) {
      y += options.gapAfter ?? 0;
      return;
    }

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;

      if (line && font.widthOfTextAtSize(candidate, size) > width) {
        ensureSpace(lineHeight);
        page!.drawText(line, {
          x,
          y: PAGE_HEIGHT - y - size,
          size,
          font,
          color: TEXT_COLOR,
        });
        y += lineHeight;
        line = word;
      } else {
        line = candidate;
      }
    }

    if (line) {
      ensureSpace(lineHeight);
      page!.drawText(line, {
        x,
        y: PAGE_HEIGHT - y - size,
        size,
        font,
        color: TEXT_COLOR,
      });
      y += lineHeight;
    }

    y += options.gapAfter ?? 0;
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-IN", {
      timeZone: data.timezone,
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-IN", {
      timeZone: data.timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const totalPrice = data.services.reduce(
    (total, service) => total + Number(service.price),
    0,
  );

  const totalDuration = data.services.reduce(
    (total, service) => total + service.durationMin,
    0,
  );

  addPage();

  drawLine("Snipr", { size: 24, font: bold, align: "center", gapAfter: 10 });
  drawLine("Booking Ticket", {
    size: 18,
    font: bold,
    align: "center",
    gapAfter: 36,
  });

  drawWrapped(`Booking reference: ${data.reference}`, {
    size: 12,
    gapAfter: 12,
  });

  drawWrapped(data.salonName, {
    size: 16,
    font: bold,
    gapAfter: 2,
  });
  drawWrapped(data.salonAddress || "Address not provided", {
    size: 11,
    gapAfter: 20,
  });

  if (data.services.length > 0) {
    drawLine(`Date: ${formatDate(data.services[0].startsAt)}`, {
      size: 12,
      gapAfter: 25,
    });
  }

  drawLine("Selected Services", {
    size: 15,
    font: bold,
    gapAfter: 12,
  });

  for (const [index, service] of data.services.entries()) {
    // Keep each service heading with at least its first detail line where possible.
    ensureSpace(70);
    drawWrapped(`${index + 1}. ${service.name}`, {
      size: 12,
      font: bold,
      gapAfter: 2,
    });
    drawWrapped(
      `Time: ${formatTime(service.startsAt)} – ${formatTime(service.endsAt)}`,
      { size: 10 },
    );
    drawWrapped(`Price: ${service.price}`, { size: 10 });
    drawWrapped(`Service duration: ${service.durationMin} minutes`, {
      size: 10,
      gapAfter: 10,
    });
  }

  y += 2;
  drawLine(`Total services: ${data.services.length}`, {
    size: 12,
    gapAfter: 4,
  });
  drawLine(`Total service duration: ${totalDuration} minutes`, {
    size: 12,
    gapAfter: 4,
  });
  drawLine(`Total price: ${totalPrice.toFixed(2)}`, {
    size: 14,
    font: bold,
    gapAfter: 32,
  });

  drawLine("Private verification key", {
    size: 14,
    font: bold,
    gapAfter: 8,
  });
  drawWrapped(data.ticketKey, { size: 12, width: 480, gapAfter: 12 });
  drawWrapped(
    "Keep this key private. Present it to the salon when asked to verify your booking.",
    { size: 9 },
  );

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}

export function generateTicketKey(): string {
  return randomBytes(24).toString("base64url");
}

export function hashTicketKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function encryptTicketKey(key: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);

  const encrypted = Buffer.concat([cipher.update(key, "utf8"), cipher.final()]);

  const tag = cipher.getAuthTag();

  return [
    "v1",
    iv.toString("hex"),
    tag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

export function decryptTicketKey(encryptedValue: string): string {
  const [version, ivHex, tagHex, ciphertextHex] = encryptedValue.split(":");

  if (version !== "v1" || !ivHex || !tagHex || !ciphertextHex) {
    throw new Error("Invalid encrypted ticket-key format");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivHex, "hex"),
  );

  decipher.setAuthTag(Buffer.from(tagHex, "hex"));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}
