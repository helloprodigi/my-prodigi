const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const agendas = await prisma.absensiAgenda.findMany({
    where: { deskripsi: null },
    include: { assignedUsers: true }
  });

  for (const agenda of agendas) {
    if (agenda.assignedUsers.length > 0) {
      const wibDayOfWeek = new Date(agenda.waktuMulai.getTime() + 7*3600*1000).getUTCDay();
      const hariMap = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const hariName = hariMap[wibDayOfWeek];
      
      const existingTemplate = await prisma.myShiftSchedule.findFirst({
        where: { dayOfWeek: wibDayOfWeek },
        include: { assignedAslabs: true }
      });
      
      if (!existingTemplate) {
        console.log(`Restoring template for ${hariName} with ${agenda.assignedUsers.length} users`);
        await prisma.myShiftSchedule.create({
          data: {
            hari: hariName,
            dayOfWeek: wibDayOfWeek,
            namaSesi: agenda.nama,
            waktuMulai: "00:00",
            waktuSelesai: "23:59",
            createdById: agenda.createdById,
            assignedAslabs: {
              create: agenda.assignedUsers.map(u => ({
                nama: u.nama,
                nim: u.nim,
                userId: u.userId,
                divisi: "Asisten Lab",
                jabatan: "Asisten Lab"
              }))
            }
          }
        });
      }
    }
  }
}
fix().then(() => console.log("Done")).catch(console.error);
