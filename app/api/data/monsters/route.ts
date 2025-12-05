import { NextResponse } from 'next/server'
import { loadData, addMonster, deleteMonster, type StoredMonster } from '@/lib/storage'

// GET - Load all monsters
export async function GET() {
  try {
    const data = loadData()
    return NextResponse.json({ monsters: data.monsters })
  } catch (error) {
    console.error('Failed to load monsters:', error)
    return NextResponse.json(
      { error: 'Failed to load monsters' },
      { status: 500 }
    )
  }
}

// POST - Add a new monster
export async function POST(request: Request) {
  try {
    const monster: StoredMonster = await request.json()
    
    if (!monster.id || !monster.name) {
      return NextResponse.json(
        { error: 'Monster must have an id and name' },
        { status: 400 }
      )
    }
    
    addMonster(monster)
    return NextResponse.json({ success: true, monster })
  } catch (error) {
    console.error('Failed to save monster:', error)
    return NextResponse.json(
      { error: 'Failed to save monster' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a monster by id
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'Monster id is required' },
        { status: 400 }
      )
    }
    
    deleteMonster(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete monster:', error)
    return NextResponse.json(
      { error: 'Failed to delete monster' },
      { status: 500 }
    )
  }
}

