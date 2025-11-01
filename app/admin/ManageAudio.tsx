// app/admin/ManageAudio.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    Modal,
    Switch,
    RefreshControl,
    ViewStyle,
    TextStyle
} from 'react-native';
import { useTheme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { AudioComfort } from '../../types/audio';
import {audioService} from "@/services/audioService";

// Helper functions for proper typing
const createToggleRowStyle = (theme: any): ViewStyle => ({
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between' as 'space-between',
    alignItems: 'center' as 'center',
    paddingVertical: theme.Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
});

const createLabelStyle = (theme: any): TextStyle => ({
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: theme.Spacing.sm,
});

const createToggleLabelStyle = (theme: any): TextStyle => ({
    fontSize: 16,
    color: theme.colors.text,
});

// ... rest of your imports and interfaces remain the same

export default function ManageAudio() {
    const theme = useTheme();
    const [audios, setAudios] = useState<AudioComfort[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingAudio, setEditingAudio] = useState<AudioComfort | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        audio_url: '',
        duration: '',
        category: '',
        speaker: '',
        is_premium: false,
        is_active: true,
    });

    useEffect(() => {
        loadAudios();
    }, []);

    const loadAudios = async () => {
        try {
            setLoading(true);
            const audioData = await audioService.getAudioComforts();
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

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            audio_url: '',
            duration: '',
            category: '',
            speaker: '',
            is_premium: false,
            is_active: true,
        });
        setEditingAudio(null);
    };

    const openAddModal = () => {
        resetForm();
        setModalVisible(true);
    };

    const openEditModal = (audio: AudioComfort) => {
        setFormData({
            title: audio.title,
            description: audio.description || '',
            audio_url: audio.audio_url,
            duration: audio.duration.toString(),
            category: audio.category || '',
            speaker: audio.speaker || '',
            is_premium: audio.is_premium || false,
            is_active: audio.is_active || true,
        });
        setEditingAudio(audio);
        setModalVisible(true);
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.title || !formData.audio_url || !formData.duration) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            if (editingAudio) {
                // Update existing audio
                await updateAudio();
            } else {
                // Add new audio
                await addAudio();
            }
            setModalVisible(false);
            loadAudios();
        } catch (error) {
            console.error('Error saving audio:', error);
            Alert.alert('Error', 'Failed to save audio');
        }
    };

    const addAudio = async () => {
        // This would typically call your Supabase API
        const newAudio: Partial<AudioComfort> = {
            title: formData.title,
            description: formData.description,
            audio_url: formData.audio_url,
            duration: parseInt(formData.duration),
            category: formData.category,
            speaker: formData.speaker,
            is_premium: formData.is_premium,
            is_active: formData.is_active,
            created_at: new Date().toISOString(),
        };

        // Simulate API call
        console.log('Adding audio:', newAudio);
        Alert.alert('Success', 'Audio added successfully!');
    };

    const updateAudio = async () => {
        if (!editingAudio) return;

        const updatedAudio: Partial<AudioComfort> = {
            ...editingAudio,
            title: formData.title,
            description: formData.description,
            audio_url: formData.audio_url,
            duration: parseInt(formData.duration),
            category: formData.category,
            speaker: formData.speaker,
            is_premium: formData.is_premium,
            is_active: formData.is_active,
        };

        // Simulate API call
        console.log('Updating audio:', updatedAudio);
        Alert.alert('Success', 'Audio updated successfully!');
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
            // Simulate API call
            console.log('Deleting audio:', audioId);
            setAudios(audios.filter(audio => audio.id !== audioId));
            Alert.alert('Success', 'Audio deleted successfully!');
        } catch (error) {
            console.error('Error deleting audio:', error);
            Alert.alert('Error', 'Failed to delete audio');
        }
    };

    const toggleAudioStatus = async (audio: AudioComfort) => {
        try {
            const updatedAudio = { ...audio, is_active: !audio.is_active };
            // Simulate API call
            console.log('Toggling audio status:', updatedAudio);
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
                flexDirection: 'row' as 'row',
                justifyContent: 'space-between' as 'space-between',
                alignItems: 'flex-start' as 'flex-start'
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

                    {audio.speaker && (
                        <Text style={{
                            fontSize: 14,
                            color: theme.colors.textSecondary,
                            marginBottom: 2,
                        }}>
                            by {audio.speaker}
                        </Text>
                    )}

                    {audio.category && (
                        <View style={{
                            backgroundColor: theme.colors.accentPrimary + '20',
                            paddingHorizontal: theme.Spacing.sm,
                            paddingVertical: 2,
                            borderRadius: theme.BorderRadius.round,
                            alignSelf: 'flex-start' as 'flex-start',
                            marginBottom: 4,
                        }}>
                            <Text style={{
                                fontSize: 10,
                                color: theme.colors.accentPrimary,
                                fontWeight: '500',
                            }}>
                                {audio.category}
                            </Text>
                        </View>
                    )}

                    <Text style={{
                        fontSize: 12,
                        color: theme.colors.textSecondary,
                    }}>
                        Duration: {Math.floor(audio.duration / 60)}:{(audio.duration % 60).toString().padStart(2, '0')}
                    </Text>

                    <View style={{
                        flexDirection: 'row' as 'row',
                        alignItems: 'center' as 'center',
                        marginTop: 4
                    }}>
                        <View style={{
                            flexDirection: 'row' as 'row',
                            alignItems: 'center' as 'center',
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
                            flexDirection: 'row' as 'row',
                            alignItems: 'center' as 'center'
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
                    flexDirection: 'row' as 'row',
                    alignItems: 'center' as 'center',
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
                        onPress={() => openEditModal(audio)}
                        style={{ padding: theme.Spacing.xs }}
                    >
                        <Ionicons name="create-outline" size={20} color={theme.colors.accentPrimary} />
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
                justifyContent: 'center' as 'center',
                alignItems: 'center' as 'center'
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
            {/* Header with Add Button */}
            <View style={{
                flexDirection: 'row' as 'row',
                justifyContent: 'space-between' as 'space-between',
                alignItems: 'center' as 'center',
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
                    onPress={openAddModal}
                    style={[
                        theme.button,
                        {
                            flexDirection: 'row' as 'row',
                            alignItems: 'center' as 'center',
                            paddingHorizontal: theme.Spacing.lg,
                        }
                    ]}
                >
                    <Ionicons name="add" size={16} color={theme.colors.textInverse} />
                    <Text style={[theme.buttonText, { marginLeft: theme.Spacing.sm }]}>
                        Add Audio
                    </Text>
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
                        alignItems: 'center' as 'center',
                        paddingVertical: theme.Spacing.xl
                    }}>
                        <Ionicons name="musical-notes-outline" size={64} color={theme.colors.textSecondary} />
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '600',
                            color: theme.colors.text,
                            marginTop: theme.Spacing.lg,
                            textAlign: 'center' as 'center',
                        }}>
                            No audio content yet
                        </Text>
                        <Text style={{
                            fontSize: 14,
                            color: theme.colors.textSecondary,
                            marginTop: theme.Spacing.sm,
                            textAlign: 'center' as 'center',
                        }}>
                            Add your first audio comfort to get started
                        </Text>
                    </View>
                ) : (
                    audios.map(audio => (
                        <AudioCard key={audio.id} audio={audio} />
                    ))
                )}
            </ScrollView>

            {/* Add/Edit Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={[theme.screen, { padding: theme.Spacing.md }]}>
                    <View style={{
                        flexDirection: 'row' as 'row',
                        justifyContent: 'space-between' as 'space-between',
                        alignItems: 'center' as 'center',
                        marginBottom: theme.Spacing.lg,
                    }}>
                        <Text style={{
                            fontSize: 20,
                            fontWeight: 'bold',
                            color: theme.colors.text,
                        }}>
                            {editingAudio ? 'Edit Audio' : 'Add New Audio'}
                        </Text>

                        <TouchableOpacity
                            onPress={() => setModalVisible(false)}
                            style={{ padding: theme.Spacing.sm }}
                        >
                            <Ionicons name="close" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                        <View style={{ gap: theme.Spacing.lg }}>
                            {/* Title */}
                            <View>
                                <Text style={createLabelStyle(theme)}>Title *</Text>
                                <TextInput
                                    style={theme.input}
                                    value={formData.title}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                                    placeholder="Enter audio title"
                                />
                            </View>

                            {/* Description */}
                            <View>
                                <Text style={createLabelStyle(theme)}>Description</Text>
                                <TextInput
                                    style={[theme.input, { height: 80, textAlignVertical: 'top' }]}
                                    value={formData.description}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                                    placeholder="Enter audio description"
                                    multiline
                                />
                            </View>

                            {/* Audio URL */}
                            <View>
                                <Text style={createLabelStyle(theme)}>Audio URL *</Text>
                                <TextInput
                                    style={theme.input}
                                    value={formData.audio_url}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, audio_url: text }))}
                                    placeholder="Enter audio file URL"
                                />
                            </View>

                            {/* Duration */}
                            <View>
                                <Text style={createLabelStyle(theme)}>Duration (seconds) *</Text>
                                <TextInput
                                    style={theme.input}
                                    value={formData.duration}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, duration: text.replace(/[^0-9]/g, '') }))}
                                    placeholder="Enter duration in seconds"
                                    keyboardType="numeric"
                                />
                            </View>

                            {/* Category */}
                            <View>
                                <Text style={createLabelStyle(theme)}>Category</Text>
                                <TextInput
                                    style={theme.input}
                                    value={formData.category}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, category: text }))}
                                    placeholder="e.g., meditation, scripture, prayer"
                                />
                            </View>

                            {/* Speaker */}
                            <View>
                                <Text style={createLabelStyle(theme)}>Speaker</Text>
                                <TextInput
                                    style={theme.input}
                                    value={formData.speaker}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, speaker: text }))}
                                    placeholder="Enter speaker name"
                                />
                            </View>

                            {/* Toggles */}
                            <View style={theme.card}>
                                <View style={createToggleRowStyle(theme)}>
                                    <Text style={createToggleLabelStyle(theme)}>Premium Content</Text>
                                    <Switch
                                        value={formData.is_premium}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, is_premium: value }))}
                                        trackColor={{ false: theme.colors.border, true: theme.colors.accentPrimary }}
                                    />
                                </View>

                                <View style={createToggleRowStyle(theme)}>
                                    <Text style={createToggleLabelStyle(theme)}>Active</Text>
                                    <Switch
                                        value={formData.is_active}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value }))}
                                        trackColor={{ false: theme.colors.border, true: theme.colors.success }}
                                    />
                                </View>
                            </View>

                            {/* Submit Button */}
                            <TouchableOpacity
                                style={theme.button}
                                onPress={handleSubmit}
                            >
                                <Text style={theme.buttonText}>
                                    {editingAudio ? 'Update Audio' : 'Add Audio'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}