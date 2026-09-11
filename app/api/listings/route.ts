import { NextResponse } from 'next/server'
import { listingsCollection } from '@/lib/mongodb'

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const item = String(form.get('item') || '').trim()
    const location = String(form.get('location') || '').trim()
    const photoName = String(form.get('photoName') || '').trim()

    if (!item || !location) {
      return NextResponse.json({ error: 'Item and location are required.' }, { status: 400 })
    }

    const collection = await listingsCollection()
    const result = await collection.insertOne({
      item,
      location,
      photoName,
      status: 'pending-assessment',
      createdAt: new Date(),
    })

    return NextResponse.json({ id: result.insertedId.toString(), status: 'pending-assessment' }, { status: 201 })
  } catch (error) {
    console.error('[] listing creation failed', error)
    return NextResponse.json({ error: 'Unable to save listing.' }, { status: 500 })
  }
}
