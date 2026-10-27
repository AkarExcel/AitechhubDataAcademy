import { prisma } from "@/lib/prisma";

export type CertificateTemplateStyle =
  | "CLASSIC_GOLD"
  | "MODERN_CYBER"
  | "MINIMAL_IVORY"
  | "EMERALD_ACADEMIC";

export interface CertificateTemplateConfig {
  style: CertificateTemplateStyle;
  academyName: string;
  academyTagline: string;
  title: string;
  subtitle: string;
  bodyStatement: string;
  primarySignatoryName: string;
  primarySignatoryTitle: string;
  primarySignatorySignature: string;
  secondarySignatoryName: string;
  secondarySignatoryTitle: string;
  secondarySignatorySignature: string;
  sealText: string;
  sealColor: string;
  accentColor: string;
  accentColorSecondary: string;
  showQrCode: boolean;
  showWatermark: boolean;
  watermarkPattern: "laurel" | "grid" | "seal" | "none";
  showCompletionDate: boolean;
  showCertificateCode: boolean;
}

export const DEFAULT_CERTIFICATE_TEMPLATE: CertificateTemplateConfig = {
  style: "CLASSIC_GOLD",
  academyName: "AI TECH HUB DATA ACADEMY",
  academyTagline: "Global Institute for Advanced Artificial Intelligence & Data Science",
  title: "CERTIFICATE OF COMPLETION",
  subtitle: "This is proudly presented to",
  bodyStatement:
    "for successfully mastering the curriculum, completing hands-on industry capstone projects, and demonstrating professional competence in",
  primarySignatoryName: "Dr. Sarah Al-Mansoor",
  primarySignatoryTitle: "Dean & Academic Director",
  primarySignatorySignature: "Sarah Al-Mansoor",
  secondarySignatoryName: "Prof. Marcus Vance",
  secondarySignatoryTitle: "Head of AI Curriculum & Research",
  secondarySignatorySignature: "Marcus Vance",
  sealText: "OFFICIAL VERIFIED CREDENTIAL • AI TECH HUB • EXCELLENCE",
  sealColor: "#d4af37",
  accentColor: "#002b4d",
  accentColorSecondary: "#d4af37",
  showQrCode: true,
  showWatermark: true,
  watermarkPattern: "laurel",
  showCompletionDate: true,
  showCertificateCode: true,
};

export const TEMPLATE_PRESETS: Record<
  CertificateTemplateStyle,
  Partial<CertificateTemplateConfig> & { name: string; description: string }
> = {
  CLASSIC_GOLD: {
    name: "Classic Gold & Navy",
    description: "Prestigious academic frame with deep royal navy, rich gold foil accents, and ornamental corners.",
    style: "CLASSIC_GOLD",
    accentColor: "#002b4d",
    accentColorSecondary: "#d4af37",
    sealColor: "#d4af37",
    watermarkPattern: "laurel",
  },
  MODERN_CYBER: {
    name: "Modern Cyber Teal",
    description: "Futuristic dark slate and cyan tech gradient with technical data lines and neon digital seal.",
    style: "MODERN_CYBER",
    accentColor: "#0f172a",
    accentColorSecondary: "#06b6d4",
    sealColor: "#06b6d4",
    watermarkPattern: "grid",
  },
  MINIMAL_IVORY: {
    name: "Minimalist Ivory Parchment",
    description: "Timeless luxury on ivory linen with crisp charcoal typography and minimalist double borders.",
    style: "MINIMAL_IVORY",
    accentColor: "#1e293b",
    accentColorSecondary: "#94a3b8",
    sealColor: "#475569",
    watermarkPattern: "seal",
  },
  EMERALD_ACADEMIC: {
    name: "Emerald Vanguard",
    description: "Distinguished deep emerald green with warm brass gold trim and academic laurels.",
    style: "EMERALD_ACADEMIC",
    accentColor: "#064e3b",
    accentColorSecondary: "#f59e0b",
    sealColor: "#f59e0b",
    watermarkPattern: "laurel",
  },
};

const TEMPLATE_SETTING_KEY = "certificate_template_config";

/**
 * Fetch the active certificate template from Supabase PlatformSetting
 * Falls back gracefully to default configuration
 */
export async function getCertificateTemplate(): Promise<CertificateTemplateConfig> {
  try {
    const setting = await prisma.platformSetting.findUnique({
      where: { key: TEMPLATE_SETTING_KEY },
    });

    if (setting?.value) {
      const parsed = JSON.parse(setting.value);
      return { ...DEFAULT_CERTIFICATE_TEMPLATE, ...parsed };
    }
  } catch (error) {
    console.warn("Could not load certificate template from DB, using defaults:", error);
  }

  return DEFAULT_CERTIFICATE_TEMPLATE;
}

/**
 * Save updated certificate template configuration to Supabase PlatformSetting
 */
export async function saveCertificateTemplate(
  config: Partial<CertificateTemplateConfig>
): Promise<CertificateTemplateConfig> {
  const current = await getCertificateTemplate();
  const merged: CertificateTemplateConfig = {
    ...current,
    ...config,
  };

  await prisma.platformSetting.upsert({
    where: { key: TEMPLATE_SETTING_KEY },
    update: {
      value: JSON.stringify(merged),
      type: "json",
      label: "Certificate Template Configuration",
    },
    create: {
      key: TEMPLATE_SETTING_KEY,
      value: JSON.stringify(merged),
      type: "json",
      label: "Certificate Template Configuration",
    },
  });

  return merged;
}
