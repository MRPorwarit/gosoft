// var app = require('express')();
// var http = require('http').Server(app);

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

const { Server } = require('socket.io');
const io = new Server(server);

const fs = require('fs')

app.use(express.static('D:/Screen_Face/bot_eyes'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('User connected')
    socket.on('audioData', (left16) => {
        console.log('do this')
        console.log(left16)
        if (left16 && left16.length > 0) {
            createWav(left16)
                .then(filePath => {
                    console.log(`ไฟล์ WAV ถูกสร้างไว้ที่: ${filePath}`);
                })
                .catch(error => {
                    console.error('เกิดข้อผิดพลาดในการสร้างไฟล์ WAV:', error);
                });
        } else {
            console.error('left16 ไม่มีข้อมูลเสียง');
        }
    });
    socket.on('disconnect', () => {
        console.log('User disconnected')
    });
});

async function stt(filePath) {
    const form = new FormData();
    form.append("file", filePath)

    const result = await fetch(`http://boonchuai-eks-ingress-799182153.ap-southeast-1.elb.amazonaws.com/api/sttinfer/th`, {
        method: "POST",
        body: form,
        headers: {
            'x-access-token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImNwY2FsbGNlbnRlckBraW5wby5jb20udGgiLCJleHAiOjE5MzkxMjY3NDl9.0UIschPQwJp1euUk3el3WFyY_AC2_wO5jq9F4yjdJeo' // แทน YOUR_ACCESS_TOKEN ด้วยโทเคนของคุณ
        }
      })
      const data = await result.json()

      if (data && data.prediction) {
        console.log(data);
        Test_STT = data.prediction;
        console.log(Test_STT);
      } else {
        console.error('Error Type');
      }
}


async function createWav(data) {
    var audioSize = data.byteLength;
    var sampleRateInHz = 8000;
    var bitDepth = 16;
    var channels = 1;
    var byteRate = (sampleRateInHz * bitDepth * channels) / 8;
    var totalDataLen = audioSize + 36;
    var header = new Int8Array(44);
    header[0] = 'R'.charCodeAt(0);  // RIFF/WAVE header
    header[1] = 'I'.charCodeAt(0);
    header[2] = 'F'.charCodeAt(0);
    header[3] = 'F'.charCodeAt(0);
    header[4] = (totalDataLen & 0xff);
    header[5] = ((totalDataLen >> 8) & 0xff);
    header[6] = ((totalDataLen >> 16) & 0xff);
    header[7] = ((totalDataLen >> 24) & 0xff);
    header[8] = 'W'.charCodeAt(0);
    header[9] = 'A'.charCodeAt(0);
    header[10] = 'V'.charCodeAt(0);
    header[11] = 'E'.charCodeAt(0);
    header[12] = 'f'.charCodeAt(0);  // 'fmt ' chunk
    header[13] = 'm'.charCodeAt(0);
    header[14] = 't'.charCodeAt(0);
    header[15] = ' '.charCodeAt(0);
    header[16] = 16;  // 4 bytes: size of 'fmt ' chunk
    header[17] = 0;
    header[18] = 0;
    header[19] = 0;
    header[20] = 1;  // format = 1
    header[21] = 0;
    header[22] = channels;
    header[23] = 0;
    header[24] = (sampleRateInHz & 0xff);
    header[25] = ((sampleRateInHz >> 8) & 0xff);
    header[26] = ((sampleRateInHz >> 16) & 0xff);
    header[27] = ((sampleRateInHz >> 24) & 0xff);
    header[28] = (byteRate & 0xff);
    header[29] = ((byteRate >> 8) & 0xff);
    header[30] = ((byteRate >> 16) & 0xff);
    header[31] = ((byteRate >> 24) & 0xff);
    header[32] = (2 * 16 / 8);  // block align
    header[33] = 0;
    header[34] = 16;  // bits per sample
    header[35] = 0;
    header[36] = 'd'.charCodeAt(0);
    header[37] = 'a'.charCodeAt(0);
    header[38] = 't'.charCodeAt(0);
    header[39] = 'a'.charCodeAt(0);
    header[40] = (audioSize & 0xff);
    header[41] = ((audioSize >> 8) & 0xff);
    header[42] = ((audioSize >> 16) & 0xff);
    header[43] = ((audioSize >> 24) & 0xff);

    var fileName = `tts_.wav`;
    var filePath = './tts_.wav'

    await fs.promises.writeFile(filePath, header);
    await fs.promises.appendFile(filePath, data);
    // logger.debug(`created WAV file "${filePath}".`);

    return filePath;
}

server.listen(5050, () => {
    console.log('listening on port 5050');
});