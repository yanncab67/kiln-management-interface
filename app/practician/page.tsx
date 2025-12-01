"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import StudentForm from "@/components/student-form"
import PiecesGrid from "@/components/pieces-grid"
import NotificationDialog from "@/components/notification-dialog"

export default function PracticianPage() {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [pieces, setPieces] = useState<any[]>([])
  const [cookedPieces, setCookedPieces] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showNotificationDialog, setShowNotificationDialog] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [pendingPieceData, setPendingPieceData] = useState<any>(null)

  useEffect(() => {
    const userString = localStorage.getItem("user")
    if (!userString) {
      window.location.href = "/"
      return
    }

    const userData = JSON.parse(userString)

    if (userData.role === "admin") {
      window.location.href = "/admin"
      return
    }

    setCurrentUser(userData)
    setIsAuthorized(true)

    // 🔴 AVANT : loadPieces() lisait localStorage
    // loadPieces()

    // 🟢 MAINTENANT : on interroge l’API en lui passant l’email
    loadPieces(userData.email)
  }, [])

  async function loadPieces(userEmail: string) {
    try {
      const res = await fetch(`/api/pieces?userEmail=${encodeURIComponent(userEmail)}`)
      if (!res.ok) {
        console.error("Erreur lors du chargement des pièces")
        return
      }
      const data = await res.json()
      setPieces(data)
    } catch (error) {
      console.error("Erreur réseau lors du chargement des pièces", error)
    }
  }

  const handleSubmit = (data: any) => {
    setPendingPieceData(data)
    setShowNotificationDialog(true)
  }

  async function handleAddPiece(formData: {
    title: string
    description?: string
    imageUrl?: string
    clayType?: string
    glazeType?: string
    firingType: string
    desiredDate?: string
    priority: "Normal" | "Urgent"
  }) {
    if (!currentUser) return

    const payload = {
      ...formData,
      submittedBy: {
        email: currentUser.email,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
      },
    }

    try {
      const res = await fetch("/api/pieces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        console.error("Erreur lors de la création de la pièce")
        return
      }

      // On pourrait lire la pièce renvoyée :
      // const created = await res.json()

      // Mais pour être sûr d’être synchro, on recharge toute la liste :
      await loadPieces(currentUser.email)
      setShowForm(false)
    } catch (error) {
      console.error("Erreur réseau lors de la création de la pièce", error)
    }
  }

  const cancelSubmit = () => {
    setShowNotificationDialog(false)
    setPendingPieceData(null)
  }
  const confirmSubmit = async () => {
    if (!pendingPieceData) return

    await handleAddPiece(pendingPieceData)

    setShowNotificationDialog(false)
    setPendingPieceData(null)
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
            <StudentForm onSubmit={handleAddPiece} onCancel={() => setShowForm(false)} />
          </div>
        )}

        {/* Pieces Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#8b6d47] mb-6">Mes pièces en attente</h2>
          {pieces.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <p className="text-slate-500 text-lg">Vous n'avez pas encore de pièces en cuisson</p>
              <p className="text-slate-400 mt-2">Cliquez sur "Nouvelle Pièce" pour commencer</p>
            </div>
          ) : (
            <PiecesGrid pieces={pieces} />
          )}
        </div>

        {cookedPieces.length > 0 && (
          <div className="mb-8">
            <Button
              onClick={() => setShowHistory(!showHistory)}
              variant="outline"
              className="mb-4 border-green-600 text-green-600 hover:bg-green-50"
            >
              {showHistory ? "Masquer" : "Afficher"} l'historique des pièces cuites ({cookedPieces.length})
            </Button>

            {showHistory && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-green-700 mb-6">Historique - Pièces cuites</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {cookedPieces.map((piece) => (
                    <div
                      key={piece.id}
                      className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200 rounded-xl overflow-hidden shadow-lg"
                    >
                      <div className="relative">
                        {piece.photo && (
                          <img
                            src={piece.photo || "/placeholder.svg"}
                            alt="Ceramic piece"
                            className="w-full h-48 object-cover"
                          />
                        )}
                        <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                          ✓ Cuite
                        </div>
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <span className="bg-[#c8623e] text-white px-3 py-1 rounded-full text-sm">
                            {piece.firingType}
                          </span>
                          {piece.temperatureType && (
                            <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                              {piece.temperatureType}
                            </span>
                          )}
                        </div>
                        {piece.clayType && <p className="text-xs text-slate-600">Type: {piece.clayType}</p>}
                        <p className="text-xs text-slate-500">
                          Soumise: {new Date(piece.submittedDate).toLocaleDateString("fr-FR")}
                        </p>
                        <p className="text-xs text-green-600 font-semibold">
                          Cuite le: {new Date(piece.firedDate).toLocaleDateString("fr-FR")}
                        </p>
                        {piece.notes && <p className="text-sm text-slate-600 italic">"{piece.notes}"</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <NotificationDialog
          open={showNotificationDialog}
          onOpenChange={setShowNotificationDialog}
          title="Notification à l'administrateur"
          description="Voulez-vous envoyer une notification par email à l'administrateur pour l'informer de l'ajout de cette pièce ?"
          onConfirm={confirmSubmit}
          onCancel={cancelSubmit}
        />
      </div>
    </div>
  )
}
