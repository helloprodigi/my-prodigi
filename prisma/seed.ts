import "dotenv/config";
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL
});

async function main() {
  console.log('Clearing existing competitions...');
  await prisma.competition.deleteMany();

  console.log('Seeding competitions...');
  
  const competitions = [
    {
      title: 'ISME 7.0 - Informatic System Memorable Exhibition',
      organizer: 'Universitas Internasional Semen Indonesia',
      deadline: new Date('2024-01-16T23:59:59Z'),
      category: 'Belmawa',
      skills: ['Data Science', 'UI/UX Design', 'Business Plan', 'Web Development'],
    },
    {
      title: 'ISME 7.0 - Informatic System Memorable Exhibition',
      organizer: 'Universitas Internasional Semen Indonesia',
      deadline: new Date('2024-01-16T23:59:59Z'),
      category: 'Belmawa',
      skills: ['Data Science', 'UI/UX Design', 'Business Plan', 'Web Development'],
    },
    {
      title: 'ISME 7.0 - Informatic System Memorable Exhibition',
      organizer: 'Universitas Internasional Semen Indonesia',
      deadline: new Date('2024-01-16T23:59:59Z'),
      category: 'Belmawa',
      skills: ['Data Science', 'UI/UX Design', 'Business Plan', 'Web Development'],
    },
    {
      title: 'ISME 7.0 - Informatic System Memorable Exhibition',
      organizer: 'Universitas Internasional Semen Indonesia',
      deadline: new Date('2024-01-16T23:59:59Z'),
      category: 'Belmawa',
      skills: ['Data Science', 'UI/UX Design', 'Business Plan', 'Web Development'],
    },
    {
      title: 'Hackathon Nasional 2024',
      organizer: 'Kementerian Komunikasi dan Informatika',
      deadline: new Date('2024-02-28T23:59:59Z'),
      category: 'Non-Belmawa',
      skills: ['Frontend', 'Backend', 'AI/ML Engineering'],
    },
    {
      title: 'UI/UX Design Competition',
      organizer: 'Tech Startup Indonesia',
      deadline: new Date('2024-03-15T23:59:59Z'),
      category: 'Non-Belmawa',
      skills: ['UI/UX Design', 'Research'],
    },
    {
      title: 'Internal Coding Challenge',
      organizer: 'Lab DTC',
      deadline: new Date('2024-04-10T23:59:59Z'),
      category: 'Internal',
      skills: ['Web Development', 'Cybersecurity'],
    }
  ];

  for (const comp of competitions) {
    await prisma.competition.create({
      data: comp
    });
  }
  
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
