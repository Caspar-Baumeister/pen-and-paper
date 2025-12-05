import { NextResponse } from 'next/server'
import { loadData, saveData, type StorageData } from '@/lib/storage'

// GET - Load all data
export async function GET() {
  try {
    const data = loadData()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to load data:', error)
    return NextResponse.json(
      { error: 'Failed to load data from storage' },
      { status: 500 }
    )
  }
}

// PUT - Update entire data object (for bulk updates)
export async function PUT(request: Request) {
  try {
    const body: Partial<StorageData> = await request.json()
    const currentData = loadData()
    
    const updatedData: StorageData = {
      worldDescription: body.worldDescription ?? currentData.worldDescription,
      areas: body.areas ?? currentData.areas,
      monsters: body.monsters ?? currentData.monsters,
      characters: body.characters ?? currentData.characters,
      npcs: body.npcs ?? currentData.npcs,
      tables: body.tables ?? currentData.tables,
      monsterTypes: body.monsterTypes ?? currentData.monsterTypes
    }
    
    saveData(updatedData)
    return NextResponse.json({ success: true, data: updatedData })
  } catch (error) {
    console.error('Failed to save data:', error)
    return NextResponse.json(
      { error: 'Failed to save data to storage' },
      { status: 500 }
    )
  }
}

