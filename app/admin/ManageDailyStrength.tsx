// app/admin/ManageDailyStrength.tsx
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { adminDailyStrengthService, DailyStrength } from '../../services/adminDailyStrengthService';

// Helper functions for proper typing
const createLabelStyle = (theme: any): TextStyle => ({
    fontSize: 16,
    fontWeight: '500' as '500',
    color: theme.colors.text,
    marginBottom: theme.Spacing.sm,
});

const createToggleRowStyle = (theme: any): ViewStyle => ({
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between' as 'space-between',
    alignItems: 'center' as 'center',
    paddingVertical: theme.Spacing.md,
});

const createToggleLabelStyle = (theme: any): TextStyle => ({
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500' as '500',
});

const createToggleDescriptionStyle = (theme: any): TextStyle => ({
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
});

export default function ManageDailyStrength() {
    const theme = useTheme();
    const [dailyStrengths, setDailyStrengths] = useState<DailyStrength[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingStrength, setEditingStrength] = useState<DailyStrength | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Form state - updated to match your database schema
    const [formData, setFormData] = useState({
        title: '',
        message: '', // Changed from content to message
        author: '',
        type: 'quote', // Default type
        is_active: true,
        approved: true, // Default to approved for admin
    });

    // Categories for dropdown
    const categories = [
        'inspiration',
        'scripture',
        'prayer',
        'reflection',
        'encouragement',
        'faith',
        'hope',
        'love'
    ];

    useEffect(() => {
        loadDailyStrengths();
    }, []);

    const loadDailyStrengths = async () => {
        try {
            setLoading(true);
            const strengths = await adminDailyStrengthService.getDailyStrengths();
            setDailyStrengths(strengths);
        } catch (error) {
            console.error('Error loading daily strengths:', error);
            Alert.alert('Error', 'Failed to load daily strengths');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadDailyStrengths();
    };

    const resetForm = () => {
        setFormData({
            title: '',
            message: '',
            author: '',
            type: 'quote',
            is_active: true,
            approved: true,
        });
        setEditingStrength(null);
    };

    const openAddModal = () => {
        resetForm();
        setModalVisible(true);
    };

    const openEditModal = (strength: DailyStrength) => {
        setFormData({
            title: strength.title || '',
            message: strength.message,
            author: strength.author || '',
            type: strength.type || 'quote',
            is_active: strength.is_active,
            approved: strength.approved,
        });
        setEditingStrength(strength);
        setModalVisible(true);
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        // Date handling removed since your schema doesn't have scheduled_date
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.title || !formData.message) {
            Alert.alert('Error', 'Please fill in title and message');
            return;
        }

        try {
            if (editingStrength) {
                await updateStrength();
            } else {
                await addStrength();
            }
            setModalVisible(false);
            loadDailyStrengths();
        } catch (error) {
            console.error('Error saving daily strength:', error);
            Alert.alert('Error', 'Failed to save daily strength');
        }
    };

    const addStrength = async () => {
        try {
            await adminDailyStrengthService.createDailyStrength({
                title: formData.title,
                message: formData.message,
                author: formData.author,
                type: formData.type,
                is_active: formData.is_active,
                approved: formData.approved,
            });
            Alert.alert('Success', 'Daily strength added successfully!');
        } catch (error) {
            console.error('Error adding daily strength:', error);
            Alert.alert('Error', 'Failed to add daily strength');
            throw error;
        }
    };

    const updateStrength = async () => {
        if (!editingStrength) return;

        try {
            await adminDailyStrengthService.updateDailyStrength(editingStrength.id, {
                title: formData.title,
                message: formData.message,
                author: formData.author,
                type: formData.type,
                is_active: formData.is_active,
                approved: formData.approved,
            });
            Alert.alert('Success', 'Daily strength updated successfully!');
        } catch (error) {
            console.error('Error updating daily strength:', error);
            Alert.alert('Error', 'Failed to update daily strength');
            throw error;
        }
    };

    const handleDelete = (strength: DailyStrength) => {
        Alert.alert(
            'Delete Daily Strength',
            `Are you sure you want to delete "${strength.title}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteStrength(strength.id)
                }
            ]
        );
    };

    const deleteStrength = async (strengthId: string) => {
        try {
            await adminDailyStrengthService.deleteDailyStrength(strengthId);
            setDailyStrengths(dailyStrengths.filter(strength => strength.id !== strengthId));
            Alert.alert('Success', 'Daily strength deleted successfully!');
        } catch (error) {
            console.error('Error deleting daily strength:', error);
            Alert.alert('Error', 'Failed to delete daily strength');
        }
    };

    const togglePublishStatus = async (strength: DailyStrength) => {
        try {
            const updatedStrength = await adminDailyStrengthService.updateDailyStrength(strength.id, {
                is_active: !strength.is_active
            });
            setDailyStrengths(dailyStrengths.map(s => s.id === strength.id ? updatedStrength : s));

            Alert.alert(
                'Success',
                updatedStrength.is_active
                    ? 'Daily strength published!'
                    : 'Daily strength unpublished!'
            );
        } catch (error) {
            console.error('Error toggling publish status:', error);
            Alert.alert('Error', 'Failed to update publish status');
        }
    };

    const getCategoryColor = (type: string) => {
        const colors: { [key: string]: string } = {
            inspiration: '#6366f1',
            scripture: '#10b981',
            prayer: '#ef4444',
            reflection: '#f59e0b',
            encouragement: '#8b5cf6',
            faith: '#06b6d4',
            hope: '#ec4899',
            love: '#dc2626',
            quote: '#6366f1',
        };
        return colors[type] || theme.colors.accentPrimary;
    };

    const StrengthCard = ({ strength }: { strength: DailyStrength }) => (
        <View style={[
            theme.card,
            {
                marginBottom: theme.Spacing.md,
                opacity: strength.is_active ? 1 : 0.7,
                borderLeftWidth: 4,
                borderLeftColor: getCategoryColor(strength.type),
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
                        fontWeight: '600' as '600',
                        color: theme.colors.text,
                        marginBottom: 4,
                    }}>
                        {strength.title || 'Untitled'}
                    </Text>

                    <Text style={{
                        fontSize: 14,
                        color: theme.colors.textSecondary,
                        lineHeight: 20,
                        marginBottom: 8,
                    }} numberOfLines={3}>
                        {strength.message}
                    </Text>

                    <View style={{
                        flexDirection: 'row' as 'row',
                        flexWrap: 'wrap' as 'wrap',
                        gap: theme.Spacing.sm,
                        marginBottom: 8
                    }}>
                        <View style={{
                            backgroundColor: getCategoryColor(strength.type) + '20',
                            paddingHorizontal: theme.Spacing.sm,
                            paddingVertical: 2,
                            borderRadius: theme.BorderRadius.round,
                        }}>
                            <Text style={{
                                fontSize: 10,
                                color: getCategoryColor(strength.type),
                                fontWeight: '500' as '500',
                                textTransform: 'capitalize',
                            }}>
                                {strength.type}
                            </Text>
                        </View>

                        {strength.author && (
                            <View style={{
                                backgroundColor: theme.colors.accentPrimary + '20',
                                paddingHorizontal: theme.Spacing.sm,
                                paddingVertical: 2,
                                borderRadius: theme.BorderRadius.round,
                            }}>
                                <Text style={{
                                    fontSize: 10,
                                    color: theme.colors.accentPrimary,
                                    fontWeight: '500' as '500',
                                }}>
                                    👤 {strength.author}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={{
                        flexDirection: 'row' as 'row',
                        justifyContent: 'space-between' as 'space-between',
                        alignItems: 'center' as 'center'
                    }}>
                        <Text style={{
                            fontSize: 12,
                            color: theme.colors.textSecondary,
                        }}>
                            {formatDate(strength.created_at)}
                        </Text>

                        <View style={{
                            flexDirection: 'row' as 'row',
                            alignItems: 'center' as 'center',
                            gap: theme.Spacing.md
                        }}>
                            <View style={{
                                flexDirection: 'row' as 'row',
                                alignItems: 'center' as 'center'
                            }}>
                                <Ionicons
                                    name={strength.is_active ? "eye" : "eye-off"}
                                    size={12}
                                    color={strength.is_active ? theme.colors.success : theme.colors.textSecondary}
                                />
                                <Text style={{
                                    fontSize: 12,
                                    color: strength.is_active ? theme.colors.success : theme.colors.textSecondary,
                                    marginLeft: 2,
                                }}>
                                    {strength.is_active ? 'Published' : 'Draft'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={{
                    flexDirection: 'row' as 'row',
                    alignItems: 'center' as 'center',
                    gap: theme.Spacing.sm,
                    marginLeft: theme.Spacing.sm
                }}>
                    <TouchableOpacity
                        onPress={() => togglePublishStatus(strength)}
                        style={{ padding: theme.Spacing.xs }}
                    >
                        <Ionicons
                            name={strength.is_active ? "eye-off-outline" : "eye-outline"}
                            size={20}
                            color={strength.is_active ? theme.colors.warning : theme.colors.success}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => openEditModal(strength)}
                        style={{ padding: theme.Spacing.xs }}
                    >
                        <Ionicons name="create-outline" size={20} color={theme.colors.accentPrimary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => handleDelete(strength)}
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
                    Loading daily strengths...
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
                <View>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: 'bold' as 'bold',
                        color: theme.colors.text,
                    }}>
                        Daily Strength ({dailyStrengths.length})
                    </Text>
                    <Text style={{
                        fontSize: 12,
                        color: theme.colors.textSecondary,
                        marginTop: 2,
                    }}>
                        Inspire your community daily
                    </Text>
                </View>

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
                        New Post
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Daily Strengths List */}
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
                {dailyStrengths.length === 0 ? (
                    <View style={{
                        alignItems: 'center' as 'center',
                        paddingVertical: theme.Spacing.xl
                    }}>
                        <Ionicons name="book-outline" size={64} color={theme.colors.textSecondary} />
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '600' as '600',
                            color: theme.colors.text,
                            marginTop: theme.Spacing.lg,
                            textAlign: 'center' as 'center',
                        }}>
                            No daily strengths yet
                        </Text>
                        <Text style={{
                            fontSize: 14,
                            color: theme.colors.textSecondary,
                            marginTop: theme.Spacing.sm,
                            textAlign: 'center' as 'center',
                        }}>
                            Create your first inspirational post
                        </Text>
                    </View>
                ) : (
                    dailyStrengths.map(strength => (
                        <StrengthCard key={strength.id} strength={strength} />
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
                            fontWeight: 'bold' as 'bold',
                            color: theme.colors.text,
                        }}>
                            {editingStrength ? 'Edit Daily Strength' : 'Create Daily Strength'}
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
                                    placeholder="Enter inspiring title"
                                />
                            </View>

                            {/* Message */}
                            <View>
                                <Text style={createLabelStyle(theme)}>Message *</Text>
                                <TextInput
                                    style={[theme.input, { height: 120, textAlignVertical: 'top' }]}
                                    value={formData.message}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, message: text }))}
                                    placeholder="Write your inspirational message..."
                                    multiline
                                    numberOfLines={5}
                                />
                            </View>

                            {/* Author */}
                            <View>
                                <Text style={createLabelStyle(theme)}>Author (Optional)</Text>
                                <TextInput
                                    style={theme.input}
                                    value={formData.author}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, author: text }))}
                                    placeholder="Your name or source"
                                />
                            </View>

                            {/* Type */}
                            <View>
                                <Text style={createLabelStyle(theme)}>Type</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View style={{
                                        flexDirection: 'row' as 'row',
                                        gap: theme.Spacing.sm
                                    }}>
                                        {['quote', 'scripture', 'prayer', 'reflection', 'encouragement'].map(type => (
                                            <TouchableOpacity
                                                key={type}
                                                onPress={() => setFormData(prev => ({ ...prev, type }))}
                                                style={{
                                                    paddingHorizontal: theme.Spacing.md,
                                                    paddingVertical: theme.Spacing.sm,
                                                    borderRadius: theme.BorderRadius.round,
                                                    backgroundColor: formData.type === type
                                                        ? getCategoryColor(type)
                                                        : theme.colors.backgroundCard,
                                                    borderWidth: 1,
                                                    borderColor: formData.type === type
                                                        ? getCategoryColor(type)
                                                        : theme.colors.border,
                                                }}
                                            >
                                                <Text style={{
                                                    fontSize: 12,
                                                    fontWeight: '500' as '500',
                                                    color: formData.type === type
                                                        ? theme.colors.textInverse
                                                        : theme.colors.textSecondary,
                                                    textTransform: 'capitalize',
                                                }}>
                                                    {type}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>

                            {/* Publish Toggle */}
                            <View style={theme.card}>
                                <View style={createToggleRowStyle(theme)}>
                                    <View>
                                        <Text style={createToggleLabelStyle(theme)}>Publish Immediately</Text>
                                        <Text style={createToggleDescriptionStyle(theme)}>
                                            Make this post visible to users
                                        </Text>
                                    </View>
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
                                    {editingStrength ? 'Update Post' : 'Create Post'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}