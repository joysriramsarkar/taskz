import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create default categories
  const categories = [
    { name: 'কাজ', color: '#3B82F6', description: 'অফিস ও কর্মসূচি সম্পর্কিত' },
    { name: 'ব্যক্তিগত', color: '#10B981', description: 'ব্যক্তিগত কাজ' },
    { name: 'অধ্যয়ন', color: '#8B5CF6', description: 'পড়াশোনা সম্পর্কিত' },
    { name: 'স্বাস্থ্য', color: '#EF4444', description: 'স্বাস্থ্য ও ফিটনেস' },
    { name: 'পরিবার', color: '#F59E0B', description: 'পরিবার সম্পর্কিত কাজ' }
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category
    })
  }

  console.log('Categories seeded successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })