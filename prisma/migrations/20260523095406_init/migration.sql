-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "coverImage" TEXT NOT NULL,
    "contentHtml" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutiveMember" (
    "id" SERIAL NOT NULL,
    "year" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nim" TEXT NOT NULL,
    "prodi" TEXT NOT NULL,
    "angkatan" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "linkedin" TEXT,
    "instagram" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExecutiveMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HallOfFame" (
    "id" SERIAL NOT NULL,
    "year" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "competition" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HallOfFame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryImage" (
    "id" SERIAL NOT NULL,
    "year" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GalleryImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionResult" (
    "id" SERIAL NOT NULL,
    "nim" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "lolos" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdmissionResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Activity_slug_key" ON "Activity"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ExecutiveMember_nim_year_key" ON "ExecutiveMember"("nim", "year");

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionResult_nim_key" ON "AdmissionResult"("nim");
