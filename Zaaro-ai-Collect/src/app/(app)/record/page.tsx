import { auth } from "@/../auth"
import RecordFlow from "./RecordFlow"

export default async function RecordPage() {
  const session = await auth()
  
  return (
    <div className="max-w-4xl mx-auto">
      <RecordFlow userLanguage="Mooré" />
    </div>
  )
}
