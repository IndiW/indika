'use client'

import { Tldraw, Editor, toRichText, createShapeId } from 'tldraw'
import 'tldraw/tldraw.css'

const PERSISTENCE_KEY = 'indika-personal-site'

function createInitialShapes(editor: Editor) {
	editor.run(() => {
		// Background header card
		editor.createShape({
			id: createShapeId(),
			type: 'geo',
			x: -420,
			y: -320,
			props: {
				geo: 'rectangle',
				w: 820,
				h: 220,
				color: 'violet',
				fill: 'solid',
				dash: 'solid',
				richText: toRichText(''),
			},
		})

		// Name heading
		editor.createShape({
			id: createShapeId(),
			type: 'text',
			x: -400,
			y: -310,
			props: {
				richText: toRichText('Indika Wijesundera'),
				color: 'white',
				size: 'xl',
				font: 'sans',
				scale: 1.8,
				autoSize: true,
			},
		})

		// Tagline
		editor.createShape({
			id: createShapeId(),
			type: 'text',
			x: -400,
			y: -200,
			props: {
				richText: toRichText('Full-Stack Engineer · Builder · Creative'),
				color: 'white',
				size: 'l',
				font: 'sans',
				scale: 1,
				autoSize: true,
			},
		})

		// About note
		editor.createShape({
			id: createShapeId(),
			type: 'note',
			x: -420,
			y: -40,
			props: {
				richText: toRichText(
					'👋 About Me\n\nI build software that people enjoy using. I care about clean code, great UX, and shipping things that matter.\n\nBased in Canada 🇨🇦'
				),
				color: 'yellow',
				size: 'm',
				font: 'sans',
				align: 'start',
			},
		})

		// Skills note
		editor.createShape({
			id: createShapeId(),
			type: 'note',
			x: 0,
			y: -40,
			props: {
				richText: toRichText(
					'🛠 Stack\n\nTypeScript · React · Next.js\nNode.js · PostgreSQL · Redis\nAWS · Docker · Vercel'
				),
				color: 'green',
				size: 'm',
				font: 'sans',
				align: 'start',
			},
		})

		// Projects note
		editor.createShape({
			id: createShapeId(),
			type: 'note',
			x: 420,
			y: -40,
			props: {
				richText: toRichText(
					'🚀 Projects\n\nOptom — optometry platform\nLvl — community product\nHera — AI-powered tool\n\n→ github.com/indiw'
				),
				color: 'blue',
				size: 'm',
				font: 'sans',
				align: 'start',
			},
		})

		// Connect note
		editor.createShape({
			id: createShapeId(),
			type: 'note',
			x: -420,
			y: 340,
			props: {
				richText: toRichText(
					'📬 Connect\n\nindikawijesundera@gmail.com\ngithub.com/indiw\n\nFeel free to reach out!'
				),
				color: 'orange',
				size: 'm',
				font: 'sans',
				align: 'start',
			},
		})

		// Canvas hint note
		editor.createShape({
			id: createShapeId(),
			type: 'note',
			x: 0,
			y: 340,
			props: {
				richText: toRichText(
					'✏️ This is an infinite canvas.\n\nYou can drag, zoom, draw, and add your own notes. Everything is yours to explore!'
				),
				color: 'light-violet',
				size: 'm',
				font: 'sans',
				align: 'start',
			},
		})

		// Decorative star
		editor.createShape({
			id: createShapeId(),
			type: 'geo',
			x: 500,
			y: 340,
			props: {
				geo: 'star',
				w: 200,
				h: 200,
				color: 'yellow',
				fill: 'semi',
				dash: 'solid',
				richText: toRichText(''),
			},
		})

		// Decorative heart
		editor.createShape({
			id: createShapeId(),
			type: 'geo',
			x: 440,
			y: -320,
			props: {
				geo: 'heart',
				w: 120,
				h: 120,
				color: 'red',
				fill: 'solid',
				dash: 'solid',
				richText: toRichText(''),
			},
		})
	})

	editor.setCamera({ x: 450, y: 400, z: 0.85 }, { animation: { duration: 0 } })
}

export default function Canvas() {
	return (
		<div className="fixed inset-0">
			<Tldraw
				persistenceKey={PERSISTENCE_KEY}
				onMount={(editor) => {
					const shapes = editor.getCurrentPageShapes()
					if (shapes.length === 0) {
						createInitialShapes(editor)
					}
				}}
			/>
		</div>
	)
}
