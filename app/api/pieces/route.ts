// app/api/pieces/route.ts
import { NextRequest, NextResponse } from "next/server"
import type { Piece } from "@/lib/types"

// ⚠️ TEMPORAIRE : stockage en mémoire (ça reset à chaque redéploiement / restart)
// On remplacera ça par une vraie base de données (Postgres, etc.) plus tard.
let piecesStore: Piece[] = []

// Récupérer les pièces
// GET /api/pieces
// GET /api/pieces?userEmail=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userEmail = searchParams.get("userEmail")

  const filtered = userEmail
    ? piecesStore.filter((p) => p.submittedBy.email === userEmail)
    : piecesStore

  return NextResponse.json(filtered)
}

// Créer une nouvelle pièce
// POST /api/pieces
// body JSON : les infos de la pièce (sans id, status, createdAt)
export async function POST(request: NextRequest) {
  const body = await request.json()

  // ⚠️ contrôle basique, à durcir plus tard
  if (!body.title || !body.submittedBy?.email) {
    return NextResponse.json(
      { error: "Titre et email utilisateur obligatoires" },
      { status: 400 },
    )
  }

  const newPiece: Piece = {
    id: Date.now(), // simple pour l’instant
    title: body.title,
    description: body.description ?? "",
    imageUrl: body.imageUrl ?? "",
    clayType: body.clayType ?? "",
    glazeType: body.glazeType ?? "",
    firingType: body.firingType ?? "Autre",
    desiredDate: body.desiredDate ?? null,
    priority: body.priority ?? "Normal",
    status: "En attente",
    createdAt: new Date().toISOString(),
    submittedBy: {
      email: body.submittedBy.email,
      firstName: body.submittedBy.firstName ?? "",
      lastName: body.submittedBy.lastName ?? "",
    },
  }

  piecesStore.push(newPiece)

  return NextResponse.json(newPiece, { status: 201 })
}
