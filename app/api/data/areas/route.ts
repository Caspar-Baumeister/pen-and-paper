import { NextResponse } from 'next/server'
import { loadData, addArea, updateArea, deleteArea, type StoredArea } from '@/lib/storage'

// GET - Load all areas
export async function GET() {
  try {
    const data = loadData()
    return NextResponse.json({ areas: data.areas })
  } catch (error) {
    console.error('Failed to load areas:', error)
    return NextResponse.json(
      { error: 'Failed to load areas' },
      { status: 500 }
    )
  }
}

// POST - Add a new area
export async function POST(request: Request) {
  try {
    const area: StoredArea = await request.json()
    
    if (!area.id || !area.name) {
      return NextResponse.json(
        { error: 'Area must have an id and name' },
        { status: 400 }
      )
    }
    
    addArea(area)
    return NextResponse.json({ success: true, area })
  } catch (error) {
    console.error('Failed to save area:', error)
    return NextResponse.json(
      { error: 'Failed to save area' },
      { status: 500 }
    )
  }
}

// PUT - Update an existing area
export async function PUT(request: Request) {
  try {
    const { id, ...updates }: { id: string } & Partial<StoredArea> = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'Area id is required' },
        { status: 400 }
      )
    }
    
    updateArea(id, updates)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update area:', error)
    return NextResponse.json(
      { error: 'Failed to update area' },
      { status: 500 }
    )
  }
}

// DELETE - Remove an area by id
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'Area id is required' },
        { status: 400 }
      )
    }
    
    deleteArea(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete area:', error)
    return NextResponse.json(
      { error: 'Failed to delete area' },
      { status: 500 }
    )
  }
}

