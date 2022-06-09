import { Frame } from "@mirohq/websdk-types"

export function keyBoards() {
    const NOTE_WIDTH = 430
    const NOTE_HEIGHT= 100
    const FRAME_BORDER = 100
    const RECORD_AREA_OFFSET = (2*FRAME_BORDER) + NOTE_WIDTH
    const SIZE_PER_MILISECOND = 0.1
    const TICK_TIMEOUT = 500
    const FRAME_WIDTH_BY_TIME = SIZE_PER_MILISECOND * 1000 * 60
    const PLAY_INTERVAL_MS = 50
    
    async function createFrame(title: string) {
        const frames = await miro.board.get({type: 'frame'})
        const currentFramesNumber = frames.filter(frame => frame.title.startsWith("MiroTune - ")).length
        const frameHeight = (NOTE_HEIGHT * 7) + (2*FRAME_BORDER)
        const frameWidth = NOTE_WIDTH + (2*FRAME_BORDER) + FRAME_WIDTH_BY_TIME
        return miro.board.createFrame({
            title,
            "style": {
            "fillColor": "#ffffff"
            },
            "x": frameWidth / 2,
            "y": (frameHeight / 2) + (frameHeight * currentFramesNumber) + (FRAME_BORDER * currentFramesNumber),
            "height": frameHeight,
            "width": frameWidth
        })
    }

    async function createBoardKeys(frame: Frame) {
        const offsetX = frame.x - (frame.width/2)
        const offsetY = frame.y - (frame.height/2)
    
        const whiteNote = {
            "content": "<p>NoteName</p>",
            "shape": "rectangle",
            "style": {
              "fillColor": "#ffffff",
              "fontFamily": "open_sans",
              "fontSize": 28,
              "textAlign": "center",
              "textAlignVertical": "bottom"
            },
            "x": 0,
            "y": 0,
            "width": NOTE_HEIGHT,
            "height": NOTE_WIDTH,
            "rotation": -90
        }
        const blackNote = {
            "content": "",
            "shape": "rectangle",
            "style": {
                "fillColor": "#1a1a1a",
                "fontFamily": "open_sans",
                "fontSize": 28,
                "textAlign": "center",
                "textAlignVertical": "middle",
            },
            "x": 0,
            "y": 0,
            "width": (whiteNote.width/3) * 2,
            "height": (whiteNote.height/3) * 2,
            "rotation": 90
        }
        
        let newPositionX = FRAME_BORDER + offsetX + (whiteNote.height/2)
        let newPositionY = FRAME_BORDER + offsetY + (whiteNote.width/2)
        
        const notes = {}
        for(const note of ["C","D","E","F","G","A","B"]) {
            const shapeCreated = await miro.board.createShape({
                ...whiteNote,
                content: `<p>${note}</p>`,
                x: newPositionX,
                y: newPositionY,
            })
            shapeCreated.y -= offsetY
            try{
                await frame.add(shapeCreated)
            } catch(e) {

            }
            notes[note] = shapeCreated
            newPositionY += whiteNote.width
        }
    
        newPositionX = FRAME_BORDER + offsetX + (blackNote.height/2)
        newPositionY = FRAME_BORDER + offsetY + (blackNote.width/2) + blackNote.width
    
        for(const note of ["C#","D#",null,"F#","G#","A#", null]) {
            if(note) {
                const shapeCreated = await miro.board.createShape({
                    ...blackNote,
                    content: `<p>${note}</p>`,
                    x: newPositionX,
                    y: newPositionY,
                })
                shapeCreated.y -= offsetY
                try{
                    await frame.add(shapeCreated)
                } catch(e) {
                    
                }
                notes[note] = shapeCreated
            }
            newPositionY += blackNote.width + (whiteNote.width/3)
        }

        return notes
    }

    async function getRecordFromFrame(frame, notes) {
        const children = await frame.getChildren()
        const notesPosition = Object.entries(notes).reduce((previous, [key, value]) => {
            return {
                ...previous,
                [value.y]: key
            }
        }, {})
        console.log('notesPosition', notesPosition)
        const recorded = {}

        for(const child of children ) {
            if(child.shape === "round_rectangle") {
                const startX = (child.x - RECORD_AREA_OFFSET - (child.width/2))
                const startTime = Math.floor(startX / SIZE_PER_MILISECOND) - (Math.floor(startX / SIZE_PER_MILISECOND) % PLAY_INTERVAL_MS)
                const duration  = Math.floor(child.width / SIZE_PER_MILISECOND)
                recorded[startTime] = [...(recorded[startTime] || []), {duration, note: notesPosition[child.y], child}]
            }
        }

        return recorded
    }
    
    async function getNotesFromFrame(frame) {
        const children = await frame.getChildren()
        const notes = {}
    
        for(const child of children ) {
            if(child.shape === "rectangle") {
                notes[child.content.replace(/<p>(.*)<\/p>/, "$1")] = child
            }
        }
    
        return notes
    }

    async function buildKeyboad(f: Frame, n) {
        const frame = f
        const notes = n || await getNotesFromFrame(frame)
        let tickTimeout = null
        let recordTick = null
        let playInterval = null
        let playTickTimeout = null
        let playTick = null
        const playingNotes = {}
        
        return {
            async startRecording() {
                recordTick = await miro.board.createShape({
                    "shape": "rectangle",
                    "style": {
                      "fillColor": "#1a1a1a",
                      "fontFamily": "open_sans",
                      "fontSize": 10,
                      "textAlign": "center",
                      "textAlignVertical": "bottom"
                    },
                    "x": frame.x - frame.width / 2 + RECORD_AREA_OFFSET,
                    "y": frame.y,
                    "width": 8,
                    "height": frame.height * 2
                })

                tickTimeout = setInterval(async () => {
                    recordTick.x += (SIZE_PER_MILISECOND * TICK_TIMEOUT)
                    await miro.board.sync(recordTick)
                    miro.board.viewport.zoomTo(recordTick)
                }, TICK_TIMEOUT)

            },
            async stopRecording() {
                if(tickTimeout) {
                    clearInterval(tickTimeout)
                    await miro.board.remove(recordTick)
                }
            },
            async startNote(note, startTime) {
                if(!tickTimeout) {
                    return false
                }
                const offsetX = frame.x - (frame.width/2)
                const offsetY = frame.y - (frame.height/2)
                const noteUpper = note.toUpperCase()
                const isAccidental = noteUpper.includes('#')
                const elementWidth =  8
                const noteElement = await miro.board.createShape({
                    "shape": "round_rectangle",
                    "content": `<p>${noteUpper}</p>`,
                    "style": {
                      "fillColor": isAccidental ? "#3D51D4" : "#6881FF",
                      "fontFamily": "open_sans",
                      "fontSize": 10,
                      "textAlign": "center",
                      "textAlignVertical": "bottom"
                    },
                    "x": offsetX + RECORD_AREA_OFFSET + Math.floor(startTime * SIZE_PER_MILISECOND) + (elementWidth/2),
                    "y": notes[noteUpper].y + offsetY,
                    "width": elementWidth,
                    "height": (notes[noteUpper].width/3) * 2
                })
                
                const timeoutId = setInterval(async () => {
                    const walkWidth = Math.floor(SIZE_PER_MILISECOND * TICK_TIMEOUT)
                    
                    console.log(">>>>>> 2", noteElement.y)
                    noteElement.width += walkWidth
                    noteElement.x +=  walkWidth / 2
                    
                    await miro.board.sync(noteElement)
                }, TICK_TIMEOUT)

                playingNotes[noteUpper] = {
                    startTime,
                    noteElement,
                    clearInterval() {
                        clearInterval(timeoutId)
                    }
                }
            },
            async stopNote(note, finishTime) {
                if(!tickTimeout || !playingNotes[note]) {
                    return false
                }
                const offsetX = frame.x - (frame.width/2)
                const offsetY = frame.y - (frame.height/2)

                const noteUpper = note.toUpperCase()
                playingNotes[noteUpper].clearInterval()
                const startTime = playingNotes[noteUpper].startTime
                const duration = finishTime - startTime

                playingNotes[noteUpper].noteElement.width =  Math.floor(duration * SIZE_PER_MILISECOND)
                playingNotes[noteUpper].noteElement.x = RECORD_AREA_OFFSET + Math.floor(startTime * SIZE_PER_MILISECOND) + (playingNotes[noteUpper].noteElement.width / 2)

                await miro.board.sync(playingNotes[noteUpper].noteElement)

                playingNotes[noteUpper].noteElement.y -= offsetY
                playingNotes[noteUpper].noteElement.x -= offsetX
                try {                    
                    await frame.add(playingNotes[noteUpper].noteElement)
                }   catch(e) {

                }

                delete playingNotes[noteUpper]

            },
            async play(onPlayNote, onStop) {
                const recorded = await getRecordFromFrame(frame, notes)
                const notesLength = Object.values(recorded).length
                console.log("RECORDED: ", recorded)

                playTick = await miro.board.createShape({
                    "shape": "rectangle",
                    "style": {
                      "fillColor": "#1a1a1a",
                      "fontFamily": "open_sans",
                      "fontSize": 10,
                      "textAlign": "center",
                      "textAlignVertical": "bottom"
                    },
                    "x": frame.x - frame.width / 2 + RECORD_AREA_OFFSET,
                    "y": frame.y,
                    "width": 8,
                    "height": frame.height * 2
                })

                playTickTimeout = setInterval(async () => {
                    playTick.x += (SIZE_PER_MILISECOND * TICK_TIMEOUT)
                    await miro.board.sync(playTick)
                    miro.board.viewport.zoomTo(playTick)
                }, TICK_TIMEOUT)
                
                let miliseconds = 0
                let count = 0
                playInterval = setInterval(async () => {
                    miliseconds += PLAY_INTERVAL_MS
                    
                    if(recorded[miliseconds]) {
                        count++
                        for(const record of recorded[miliseconds]){
                            onPlayNote(record.note, record.duration)
                            const activeNoteElement = await miro.board.createShape({
                                "shape": "round_rectangle",
                                "style": {
                                  "fillColor": "#77CC66",
                                },
                                "x": record.child.x + frame.x - frame.width / 2,
                                "y": record.child.y + frame.y - frame.height / 2,
                                "width": record.child.width,
                                "height": record.child.height
                            })
                            setTimeout(() => {
                                miro.board.remove(activeNoteElement)
                            }, record.duration)
                        }
                    }

                    if(notesLength === count) {
                        console.log("stopped")
                        this.stopPlaying()
                        onStop && onStop()
                    }
                }, PLAY_INTERVAL_MS)
            },
            stopPlaying() {
                clearInterval(playInterval)
                clearInterval(playTickTimeout)
                miro.board.remove(playTick)
            },
            getFrame() {
                return frame
            }
        }
    }

    return {
        createKeyboard: async (title: string) => {
            const frame = await createFrame(title)
            const notes = await createBoardKeys(frame)
            return buildKeyboad(frame, notes)
        },
        prepareKeyboard: buildKeyboad,
    }
}
