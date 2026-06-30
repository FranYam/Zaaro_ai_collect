const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10)
  
  // Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@zaaro.ai' },
    update: {},
    create: {
      email: 'admin@zaaro.ai',
      name: 'Admin Zaaro',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  })

  console.log({ admin })

  // Insert Phrases
  const phrases = [
    { text: "Depuis combien de temps ressentez-vous cette douleur ?", domain: "sante" },
    { text: "Avez-vous des antécédents médicaux familiaux ?", domain: "sante" },
    { text: "Quels sont les documents nécessaires pour obtenir une carte d'identité ?", domain: "administration" },
    { text: "Où puis-je payer mes impôts locaux ?", domain: "administration" },
    { text: "Quels engrais recommandez-vous pour la culture du maïs cette saison ?", domain: "agriculture" },
    { text: "Comment puis-je protéger mes cultures contre les insectes ravageurs ?", domain: "agriculture" },
    { text: "Quelles sont les conditions pour obtenir un micro-crédit ?", domain: "finance" },
    { text: "Je souhaite ouvrir un compte d'épargne mobile.", domain: "finance" },
  ]

  for (const p of phrases) {
    await prisma.phrase.create({
      data: p
    })
  }
  console.log("Database seeded with phrases.")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
