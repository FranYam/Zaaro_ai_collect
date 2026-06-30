const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  // Set a default duration of 5 seconds for all recordings with 0 duration
  const result = await p.recording.updateMany({
    where: { duration: 0 },
    data: { duration: 5 }
  })
  console.log('Updated recordings:', result.count)
}

main().then(() => p.$disconnect()).catch(e => { console.error(e); p.$disconnect(); })
