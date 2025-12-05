import { NextResponse } from 'next/server'
import { loadData, addNPC, updateNPC, deleteNPC, type StoredNPC } from '@/lib/storage'

// GET - Load all NPCs or a specific NPC
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    const data = loadData()

    if (id) {
      const npc = data.npcs.find((n) => n.id === id)
      if (!npc) {
        return NextResponse.json(
          { error: 'NPC not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ npc })
    }

    return NextResponse.json({ npcs: data.npcs || [] })
  } catch (error) {
    console.error('Failed to load NPCs:', error)
    return NextResponse.json(
      { error: 'Failed to load NPCs' },
      { status: 500 }
    )
  }
}

// POST - Add a new NPC
export async function POST(request: Request) {
  try {
    const npc: StoredNPC = await request.json()

    if (!npc.id || !npc.name) {
      return NextResponse.json(
        { error: 'NPC must have an id and name' },
        { status: 400 }
      )
    }

    addNPC(npc)
    return NextResponse.json({ success: true, npc })
  } catch (error) {
    console.error('Failed to save NPC:', error)
    return NextResponse.json(
      { error: 'Failed to save NPC' },
      { status: 500 }
    )
  }
}

// PUT - Update an existing NPC
export async function PUT(request: Request) {
  try {
    const { id, ...updates }: { id: string } & Partial<StoredNPC> = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'NPC id is required' },
        { status: 400 }
      )
    }

    updateNPC(id, updates)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update NPC:', error)
    return NextResponse.json(
      { error: 'Failed to update NPC' },
      { status: 500 }
    )
  }
}

// DELETE - Remove an NPC by id
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'NPC id is required' },
        { status: 400 }
      )
    }

    deleteNPC(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete NPC:', error)
    return NextResponse.json(
      { error: 'Failed to delete NPC' },
      { status: 500 }
    )
  }
}

