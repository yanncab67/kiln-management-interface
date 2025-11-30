"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import StudentForm from "@/components/student-form"
import PiecesGrid from "@/components/pieces-grid"

export default function PracticianPage() {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [pieces, setPieces] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (!userStr) {
      router.push("/")
      return
    }

    const user = JSON.parse(userStr)
    setCurrentUser(user)

    loadPieces(user.email)
  }, [router])

  const loadPieces = (userEmail: string) => {
    const allPieces = JSON.parse(localStorage.getItem("pieces") || "[]")
    const userPieces = allPieces.filter((piece: any) => piece.submittedBy?.email === userEmail)
    setPieces(userPieces)
  }

  const handleSubmit = (data: any) => {
    const newPiece = {
      id: Date.now(),
      ...data,
      status: "En attente",
      submittedBy: {
        email: currentUser?.email,
        firstName: currentUser?.firstName,
        lastName: currentUser?.lastName,
      },
    }

    const allPieces = JSON.parse(localStorage.getItem("pieces") || "[]")
    const updatedPieces = [...allPieces, newPiece]
    localStorage.setItem("pieces", JSON.stringify(updatedPieces))

    loadPieces(currentUser?.email)
    setShowForm(false)
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  if (!currentUser) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5d4c5] to-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#8b6d47] flex items-center gap-2">🏺 Mes Pièces en Cuisson</h1>
              <p className="text-slate-600 mt-1">
                Connecté en tant que: {currentUser.firstName} {currentUser.lastName} ({currentUser.email})
              </p>
            </div>
            <Button onClick={handleLogout} className="bg-blue-600 hover:bg-blue-700">
              Déconnexion
            </Button>
          </div>
        </div>

        {/* New Piece Button */}
        {!showForm && (
          <div className="mb-8">
            <Button
              onClick={() => setShowForm(true)}
              className="w-full md:w-auto bg-[#c8623e] hover:bg-[#b8523e] text-white text-lg py-6 px-8 rounded-xl font-semibold"
            >
              ➕ Nouvelle Pièce
            </Button>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8">
            <h2 className="text-2xl font-bold text-[#8b6d47] mb-6">Ajouter une nouvelle pièce</h2>
            <StudentForm onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />
          </div>
        )}

        {/* Pieces Grid */}
        <div>
          <h2 className="text-2xl font-bold text-[#8b6d47] mb-6">Mes pièces</h2>
          {pieces.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <p className="text-slate-500 text-lg">Vous n'avez pas encore de pièces en cuisson</p>
              <p className="text-slate-400 mt-2">Cliquez sur "Nouvelle Pièce" pour commencer</p>
            </div>
          ) : (
            <PiecesGrid pieces={pieces} />
          )}
        </div>
      </div>
    </div>
  )
}
