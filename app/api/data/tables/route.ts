import { NextResponse } from 'next/server'
import { loadData, addTable, updateTable, deleteTable, type StoredTable } from '@/lib/storage'

// GET - Load all tables
export async function GET() {
  try {
    const data = loadData()
    return NextResponse.json({ tables: data.tables })
  } catch (error) {
    console.error('Failed to load tables:', error)
    return NextResponse.json(
      { error: 'Failed to load tables' },
      { status: 500 }
    )
  }
}

// POST - Add a new table
export async function POST(request: Request) {
  try {
    const table: StoredTable = await request.json()
    
    if (!table.id || !table.name) {
      return NextResponse.json(
        { error: 'Table must have an id and name' },
        { status: 400 }
      )
    }
    
    addTable(table)
    return NextResponse.json({ success: true, table })
  } catch (error) {
    console.error('Failed to save table:', error)
    return NextResponse.json(
      { error: 'Failed to save table' },
      { status: 500 }
    )
  }
}

// PUT - Update an existing table
export async function PUT(request: Request) {
  try {
    const { id, ...updates }: { id: string } & Partial<StoredTable> = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'Table id is required' },
        { status: 400 }
      )
    }
    
    updateTable(id, updates)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update table:', error)
    return NextResponse.json(
      { error: 'Failed to update table' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a table by id
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'Table id is required' },
        { status: 400 }
      )
    }
    
    deleteTable(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete table:', error)
    return NextResponse.json(
      { error: 'Failed to delete table' },
      { status: 500 }
    )
  }
}

