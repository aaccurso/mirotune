export function keyBoards() {
    const NOTE_WIDTH = 430
    const NOTE_HEIGHT= 100
    const FRAME_BORDER = 100
    const RECORD_AREA_OFFSET = (2*FRAME_BORDER) + NOTE_WIDTH
    const SIZE_PER_MILISECOND = 0.1
    const TICK_TIMEOUT = 500
    const FRAME_WIDTH_BY_TIME = SIZE_PER_MILISECOND * 1000 * 60
    
    async function createFrame() {
        const frameHeight = (NOTE_HEIGHT * 7) + (2*FRAME_BORDER)
        const frameWidth = NOTE_WIDTH + (2*FRAME_BORDER) + FRAME_WIDTH_BY_TIME
        return await miro.board.createFrame({
            "title": "Frame 1",
            "style": {
            "fillColor": "#ffffff"
            },
            "x": frameWidth / 2,
            "y": frameHeight / 2,
            "height": frameHeight,
            "width": frameWidth
        })
    }

    async function createBoardKeys(frame) {
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
            frame.add(shapeCreated)
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
                frame.add(shapeCreated)
                notes[note] = shapeCreated
            }
            newPositionY += blackNote.width + (whiteNote.width/3)
        }

        await miro.board.viewport.zoomTo(Object.values(notes))
        console.log(notes)
        return notes
    }

    async function getRecordFromFrame(frame, notes) {
        const children = await frame.getChildren()
        console.log(children)
        const notesPosition = Object.entries(notes).reduce((previous, [key, value]) => {
            return {
                ...previous,
                [value.y]: key
            }
        }, {})
        const recorded = {}

        for(const child of children ) {
            if(child.shape === "round_rectangle") {
                const startX = (child.x - RECORD_AREA_OFFSET - (child.width/2))
                const startTime = Math.floor(startX / SIZE_PER_MILISECOND)
                const duration  = Math.floor((startX + child.width) / SIZE_PER_MILISECOND)
                recorded[startTime] = [...(recorded[startTime] || []), {duration, note: notesPosition[child.y]}]
            }
        }

        return recorded
    }
    
    async function getNotesFromFrame(frame) {
        const children = frame.getChildren()
        const notes = {}
    
        for(const child of children ) {
            if(child.shape === "rectangle") {
                notes[child.content.replace("<p>(.*)</p>", "$1")] = child
            }
        }
    
        return notes
    }

    function buildKeyboad(f, n) {
        const frame = f
        const notes = n || getNotesFromFrame(frame)
        let tickTimeout = null
        let recordTick = null
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
                    "x": RECORD_AREA_OFFSET,
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

                const noteUpper = note.toUpperCase()
                const elementWidth =  8
                const noteElement = await miro.board.createShape({
                    "shape": "round_rectangle",
                    "content": `<p>${noteUpper}</p>`,
                    "style": {
                      "fillColor": "#6881FF",
                      "fontFamily": "open_sans",
                      "fontSize": 10,
                      "textAlign": "center",
                      "textAlignVertical": "bottom"
                    },
                    "x": RECORD_AREA_OFFSET + Math.floor(startTime * SIZE_PER_MILISECOND) + (elementWidth/2),
                    "y": notes[noteUpper].y,
                    "width": elementWidth,
                    "height": (notes[noteUpper].width/3) * 2
                })
                
                const timeoutId = setInterval(() => {
                    const walkWidth = Math.floor(SIZE_PER_MILISECOND * TICK_TIMEOUT)
                    noteElement.width += walkWidth
                    noteElement.x +=  walkWidth / 2

                    miro.board.sync(noteElement)
                }, TICK_TIMEOUT)

                playingNotes[noteUpper] = {
                    startTime,
                    noteElement,
                    clearTimeout() {
                        clearTimeout(timeoutId)
                    }
                }
            },
            async stopNote(note, finishTime) {
                if(!tickTimeout || !playingNotes[note]) {
                    return false
                }
                const noteUpper = note.toUpperCase()
                playingNotes[noteUpper].clearTimeout()
                const startTime = playingNotes[noteUpper].startTime
                const duration = finishTime - startTime

                playingNotes[noteUpper].noteElement.width =  Math.floor(duration * SIZE_PER_MILISECOND)
                playingNotes[noteUpper].noteElement.x =  RECORD_AREA_OFFSET + Math.floor(startTime * SIZE_PER_MILISECOND) + (playingNotes[noteUpper].noteElement.width / 2)

                await miro.board.sync(playingNotes[noteUpper].noteElement)
                await frame.add(playingNotes[noteUpper].noteElement)

                delete playingNotes[noteUpper]

            },
            async play(onPlayNote) {
                const recorded = await getRecordFromFrame(frame, notes)
                console.log("RECORDED: ", recorded)
                let miliseconds = 0
                const intervalId = setInterval(() => {
                    miliseconds++
                    if(recorded[miliseconds]) {
                        for(const record of recorded[miliseconds]){
                            onPlayNote(record.note, record.duration)
                        }
                    }

                    delete recorded[miliseconds]

                    if(Object.values(recorded).length <= 0) {
                        console.log("stopped")
                        clearTimeout(intervalId)
                    }
                }, 1)
            },
            pause() {
    
            },
            stopPlaying() {
                
            },
        }
    }

    return {
        createKeyboard: async () => {
            const frame = await createFrame()
            const notes = await createBoardKeys(frame)
            return buildKeyboad(frame, notes)
        }
    }
}

// const keyboards = keyBoards()
// const keyboard = await keyboards.createKeyboard()

// await keyboard.startRecording();
// setTimeout(async () => {
//     await keyboard.startNote("C", 1000)
//     setTimeout(async () => {
//         await keyboard.stopNote("C", 5000)
//         keyboard.stopRecording();
//     }, 4000)
// }, 1000)
