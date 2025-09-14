-- CreateTable
CREATE TABLE "public"."CustomVoice" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CustomVoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomVoice_userId_name_key" ON "public"."CustomVoice"("userId", "name");

-- AddForeignKey
ALTER TABLE "public"."CustomVoice" ADD CONSTRAINT "CustomVoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
