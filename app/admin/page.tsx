"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import AdminPieceCard from "@/components/admin-piece-card"
import AdminFilters from "@/components/admin-filters"
import AdminStats from "@/components/admin-stats"
import NotificationDialog from "@/components/notification-dialog"

const handleLogout = () => {
  // Logout logic here
}

export default function AdminPage() {
  const [pieces, setPieces] = useState<any[]>([])
  const [cookedPieces, setCookedPieces] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState("Tous")
  const [firingTypeFilter, setFiringTypeFilter] = useState("Tous")
  const [sortBy, setSortBy] = useState("date")
  const [showCookedHistory, setShowCookedHistory] = useState(false)
  const [markingId, setMarkingId] = useState<number | null>(null)
  const [showNotificationDialog, setShowNotificationDialog] = useState(false)
  const [pendingPieceId, setPendingPieceId] = useState<number | null>(null)

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (user) setCurrentUser(JSON.parse(user))
    loadPieces()
  }, [])

  const loadPieces = () => {
    const stored = localStorage.getItem("pieces")
    const cooked = localStorage.getItem("cookedPieces")
    if (stored) setPieces(JSON.parse(stored).filter((p: any) => p.status !== "Prêt"))
    if (cooked) setCookedPieces(JSON.parse(cooked))
  }

  const handleMarkAsFired = (id: number) => {
    setPendingPieceId(id)
    setShowNotificationDialog(true)
  }

  const confirmMarkAsFired = () => {
    if (pendingPieceId === null) return

    setMarkingId(pendingPieceId)
    setTimeout(() => {
      const piece = pieces.find((p) => p.id === pendingPieceId)
      if (piece) {
        const cookedWith = {
          ...piece,
          status: "Prêt",
          firedDate: new Date().toISOString(),
        }
        const updatedPieces = pieces.filter((p) => p.id !== pendingPieceId)
        const updatedCooked = [...cookedPieces, cookedWith]

        setPieces(updatedPieces)
        setCookedPieces(updatedCooked)
        localStorage.setItem("pieces", JSON.stringify(updatedPieces))
        localStorage.setItem("cookedPieces", JSON.stringify(updatedCooked))

        if (piece.submittedBy) {
          console.log(
            `[v0] Email notification sent to ${piece.submittedBy.email} (${piece.submittedBy.firstName} ${piece.submittedBy.lastName}) - Piece is ready`,
          )
        }
      }
      setMarkingId(null)
      setShowNotificationDialog(false)
      setPendingPieceId(null)
    }, 500)
  }

  const cancelMarkAsFired = () => {
    setShowNotificationDialog(false)
    setPendingPieceId(null)
  }

  const logout = () => {
    localStorage.removeItem("currentUser")
    window.location.href = "/"
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5d4c5] to-white">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#8b6d47]">🔥 Gestion des cuissons</h1>
            {currentUser && (
              <p className="text-sm text-gray-600 mt-1">
                Connecté en tant que:{" "}
                <span className="font-semibold">
                  {currentUser.firstName} {currentUser.lastName}
                </span>{" "}
                ({currentUser.email})
              </p>
            )}
          </div>
          <Button onClick={logout} className="bg-blue-600 hover:bg-blue-700">
            Déconnexion
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <AdminStats
          pieces={pieces}
          cookedPieces={cookedPieces}
          getPriority={getPriority}
          getDaysRemaining={getDaysRemaining}
        />

        {/* Toggle History */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[#8b6d47]">Pièces en attente de cuisson</h2>
          <Button
            onClick={() => setShowCookedHistory(!showCookedHistory)}
            className="bg-[#c8623e] hover:bg-[#b5512f] text-white"
          >
            {showCookedHistory ? "Masquer" : "Voir"} l'historique ({cookedPieces.length})
          </Button>
        </div>

        {/* Filters */}
        {!showCookedHistory && (
          <AdminFilters
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            firingTypeFilter={firingTypeFilter}
            setFiringTypeFilter={setFiringTypeFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />
        )}

        {/* Pieces Grid */}
        {!showCookedHistory ? (
          <div className="space-y-4">
            {pieces.length === 0 ? (
              <Card className="bg-slate-50">
                <CardContent className="p-8 text-center text-gray-600">Aucune pièce en attente de cuisson</CardContent>
              </Card>
            ) : (
              pieces.map((piece) => (
                <div
                  key={piece.id}
                  className={`transition-all duration-500 transform ${
                    markingId === piece.id ? "scale-95 opacity-50" : "scale-100 opacity-100"
                  }`}
                >
                  <AdminPieceCard
                    piece={piece}
                    priority={getPriority(piece)}
                    daysRemaining={getDaysRemaining(piece.desiredDate)}
                    onMarkAsFired={handleMarkAsFired}
                  />
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {cookedPieces.length === 0 ? (
              <Card className="bg-slate-50">
                <CardContent className="p-8 text-center text-gray-600">Aucune pièce dans l'historique</CardContent>
              </Card>
            ) : (
              cookedPieces.map((piece) => (
                <Card key={piece.id} className="bg-green-50 border-l-4 border-green-600">
                  <CardContent className="p-6">
                    <div className="grid gap-6 md:grid-cols-5 md:items-center">
                      {piece.photo && (
                        <div>
                          <img
                            src={piece.photo || "/placeholder.svg"}
                            alt="Ceramic piece"
                            className="w-full h-24 object-cover rounded-lg"
                          />
                        </div>
                      )}
                      <div className="md:col-span-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-green-700">✅ Cuit</span>
                        </div>
                        {piece.submittedBy && (
                          <p className="text-sm font-semibold text-slate-700">
                            👤 {piece.submittedBy.firstName} {piece.submittedBy.lastName}
                          </p>
                        )}
                        <p className="text-xs text-slate-600">
                          Cuit le: {new Date(piece.firedDate).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-slate-600">Type</p>
                        <p className="text-sm font-bold text-[#c8623e]">{piece.firingType}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      <NotificationDialog
        open={showNotificationDialog}
        onOpenChange={setShowNotificationDialog}
        title="Notification à l'artisan"
        description="Voulez-vous envoyer une notification par email à l'artisan pour l'informer que sa pièce est prête ?"
        onConfirm={confirmMarkAsFired}
        onCancel={cancelMarkAsFired}
      />
    </div>
  )
}

const getPriority = (piece: any) => {
  const now = new Date()
  const desired = new Date(piece.desiredDate)
  const daysRemaining = Math.ceil((desired.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (daysRemaining <= 2) return "urgent"
  if (daysRemaining <= 5) return "soon"
  return "ok"
}

const getDaysRemaining = (date: string) => {
  const now = new Date()
  const desired = new Date(date)
  return Math.ceil((desired.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}
