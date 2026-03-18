-- CreateTable
CREATE TABLE IF NOT EXISTS "app_config" (
    "id" TEXT NOT NULL,
    "app_name" TEXT NOT NULL DEFAULT '4Save',
    "report_logo_url" TEXT NOT NULL DEFAULT '',
    "pdf_template" TEXT NOT NULL DEFAULT 'classic',
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "app_config_pkey" PRIMARY KEY ("id")
);

