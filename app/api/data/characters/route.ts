import { NextResponse } from 'next/server'
import { loadData, addCharacter, deleteCharacter, type StoredCharacter } from '@/lib/storage'

// GET - Load all characters
export async function GET() {
  try {
    const data = loadData()
    return NextResponse.json({ characters: data.characters })
  } catch (error) {
    console.error('Failed to load characters:', error)
    return NextResponse.json(
      { error: 'Failed to load characters' },
      { status: 500 }
    )
  }
}

// POST - Add a new character
export async function POST(request: Request) {
  try {
    const character: StoredCharacter = await request.json()
    
    if (!character.id || !character.name) {
      return NextResponse.json(
        { error: 'Character must have an id and name' },
        { status: 400 }
      )
    }
    
    addCharacter(character)
    return NextResponse.json({ success: true, character })
  } catch (error) {
    console.error('Failed to save character:', error)
    return NextResponse.json(
      { error: 'Failed to save character' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a character by id
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'Character id is required' },
        { status: 400 }
      )
    }
    
    deleteCharacter(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete character:', error)
    return NextResponse.json(
      { error: 'Failed to delete character' },
      { status: 500 }
    )
  }
}

