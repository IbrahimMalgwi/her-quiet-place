// components/AudioCard.debug.tsx - Temporary debug version
import React from 'react';
import { View, Text } from 'react-native';
import { AudioComfort } from '../types/audio';

type Props = {
    audio: AudioComfort;
};

export default function AudioCardDebug({ audio }: Props) {
    console.log('Rendering AudioCard with audio:', audio.title);

    return (
        <View style={{
            backgroundColor: 'white',
            padding: 16,
            margin: 8,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#ccc'
        }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
                {audio.title}
            </Text>
            {audio.speaker && (
                <Text style={{ fontSize: 12, color: '#666' }}>
                    by {audio.speaker}
                </Text>
            )}
            <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                Duration: {Math.floor(audio.duration / 60)}:{(audio.duration % 60).toString().padStart(2, '0')}
            </Text>
        </View>
    );
}