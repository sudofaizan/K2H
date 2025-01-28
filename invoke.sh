while true
do
if [ -f ./temp/output.wav ]
then
python3 stt.py 2>&1 |tail -1 >temp/op.txt&& node tts.js && play temp/output.mp3 && rm temp/output.mp3
rm -rf temp/*
fi
done