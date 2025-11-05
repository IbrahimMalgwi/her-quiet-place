// app/admin/ManageAudio.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useTheme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { AudioComfort } from '../../types/audio';
import { adminAudioService } from '../../services/adminAudioService';
import { useAuth } from '../../contexts/AuthContext';

export default function ManageAudio() {
    const theme = useTheme();
    const { user } = useAuth();
    const [audios, setAudios] = useState<AudioComfort[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadAudios();
    }, []);

    const loadAudios = async () => {
        try {
            setLoading(true);
            const audioData = await adminAudioService.getAudioComforts();
            setAudios(audioData);
        } catch (error) {
            console.error('Error loading audios:', error);
            Alert.alert('Error', 'Failed to load audio content');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadAudios();
    };

    const pickAndUploadAudio = async () => {
        try {
            // Pick audio file
            const file = await adminAudioService.pickAudioFile();

            // Validate the file
            const validation = adminAudioService.validateAudioFile(file);
            if (!validation.valid) {
                Alert.alert('Invalid File', validation.message);
                return;
            }

            setUploading(true);

            // Generate unique filename
            const fileExtension = file.name.split('.').pop();
            const fileName = `audio_${Date.now()}.${fileExtension}`;

            // Upload file to Supabase storage
            const publicUrl = await adminAudioService.uploadAudioFile(file.uri, fileName);

            // Create audio record in database
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Use filename without extension as title
            const title = file.name.replace(/\.[^/.]+$/, "");

            await adminAudioService.createAudioComfort({
                title: title,
                audio_url: publicUrl,
                is_premium: false,
                is_active: true,
                created_by: user.id,
            });

            Alert.alert('Success', 'Audio uploaded successfully!');
            loadAudios(); // Refresh the list

        } catch (error: any) {
            if (error.message === 'File selection canceled') {
                return; // Don't show error for canceled selection
            }

            console.error('Error uploading audio:', error);

            // Show specific error messages
            if (error.message?.includes('row-level security policy') || error.code === '42501') {
                Alert.alert(
                    'Permission Denied',
                    'Please check your database permissions. You may need to set up RLS policies for the audio_comforts table.'
                );
            } else if (error.message?.includes('not authenticated')) {
                Alert.alert('Authentication Error', 'Please log in again to upload files.');
            } else {
                Alert.alert('Upload Error', error.message || 'Failed to upload audio file');
            }
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = (audio: AudioComfort) => {
        Alert.alert(
            'Delete Audio',
            `Are you sure you want to delete "${audio.title}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteAudio(audio.id)
                }
            ]
        );
    };

    const deleteAudio = async (audioId: string) => {
        try {
            await adminAudioService.deleteAudioComfort(audioId);
            setAudios(audios.filter(audio => audio.id !== audioId));
            Alert.alert('Success', 'Audio deleted successfully!');
        } catch (error) {
            console.error('Error deleting audio:', error);
            Alert.alert('Error', 'Failed to delete audio');
        }
    };

    const toggleAudioStatus = async (audio: AudioComfort) => {
        try {
            const updatedAudio = await adminAudioService.updateAudioComfort(audio.id, {
                is_active: !audio.is_active
            });
            setAudios(audios.map(a => a.id === audio.id ? updatedAudio : a));
        } catch (error) {
            console.error('Error toggling audio status:', error);
            Alert.alert('Error', 'Failed to update audio status');
        }
    };

    const AudioCard = ({ audio }: { audio: AudioComfort }) => (
        <View style={[
            theme.card,
            {
                marginBottom: theme.Spacing.md,
                opacity: audio.is_active ? 1 : 0.6
            }
        ]}>
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
            }}>
                <View style={{ flex: 1 }}>
                    <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: theme.colors.text,
                        marginBottom: 4,
                    }}>
                        {audio.title}
                    </Text>

                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: 4
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginRight: theme.Spacing.lg
                        }}>
                            <Ionicons
                                name={audio.is_premium ? "star" : "star-outline"}
                                size={14}
                                color={audio.is_premium ? theme.colors.warning : theme.colors.textSecondary}
                            />
                            <Text style={{
                                fontSize: 12,
                                color: theme.colors.textSecondary,
                                marginLeft: 4,
                            }}>
                                {audio.is_premium ? 'Premium' : 'Free'}
                            </Text>
                        </View>

                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center'
                        }}>
                            <Ionicons
                                name={audio.is_active ? "checkmark-circle" : "close-circle"}
                                size={14}
                                color={audio.is_active ? theme.colors.success : theme.colors.error}
                            />
                            <Text style={{
                                fontSize: 12,
                                color: audio.is_active ? theme.colors.success : theme.colors.error,
                                marginLeft: 4,
                            }}>
                                {audio.is_active ? 'Active' : 'Inactive'}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.Spacing.sm
                }}>
                    <TouchableOpacity
                        onPress={() => toggleAudioStatus(audio)}
                        style={{ padding: theme.Spacing.xs }}
                    >
                        <Ionicons
                            name={audio.is_active ? "pause-circle" : "play-circle"}
                            size={20}
                            color={audio.is_active ? theme.colors.warning : theme.colors.success}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => handleDelete(audio)}
                        style={{ padding: theme.Spacing.xs }}
                    >
                        <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={[theme.screen, {
                justifyContent: 'center',
                alignItems: 'center'
            }]}>
                <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
                <Text style={{ marginTop: theme.Spacing.md, color: theme.colors.text }}>
                    Loading audio content...
                </Text>
            </View>
        );
    }

    return (
        <View style={theme.screen}>
            {/* Header with Upload Button */}
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: theme.Spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
            }}>
                <Text style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: theme.colors.text,
                }}>
                    Manage Audio ({audios.length})
                </Text>

                <TouchableOpacity
                    onPress={pickAndUploadAudio}
                    disabled={uploading}
                    style={[
                        theme.button,
                        uploading && { opacity: 0.6 },
                        {
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: theme.Spacing.lg,
                        }
                    ]}
                >
                    {uploading ? (
                        <ActivityIndicator size="small" color={theme.colors.textInverse} />
                    ) : (
                        <>
                            <Ionicons name="cloud-upload-outline" size={16} color={theme.colors.textInverse} />
                            <Text style={[theme.buttonText, { marginLeft: theme.Spacing.sm }]}>
                                Upload Audio
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Audio List */}
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: theme.Spacing.md }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[theme.colors.accentPrimary]}
                    />
                }
            >
                {audios.length === 0 ? (
                    <View style={{
                        alignItems: 'center',
                        paddingVertical: theme.Spacing.xl
                    }}>
                        <Ionicons name="musical-notes-outline" size={64} color={theme.colors.textSecondary} />
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '600',
                            color: theme.colors.text,
                            marginTop: theme.Spacing.lg,
                            textAlign: 'center',
                        }}>
                            No audio content yet
                        </Text>
                        <Text style={{
                            fontSize: 14,
                            color: theme.colors.textSecondary,
                            marginTop: theme.Spacing.sm,
                            textAlign: 'center',
                        }}>
                            Tap "Upload Audio" to add your first audio file
                        </Text>
                    </View>
                ) : (
                    audios.map(audio => (
                        <AudioCard key={audio.id} audio={audio} />
                    ))
                )}
            </ScrollView>
        </View>
    );
}