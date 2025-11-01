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

interface DailyStrength {
    id: string;
    title: string;
    content: string;
    bible_verse?: string;
    author?: string;
    category: string;
    scheduled_date: string;
    is_published: boolean;
    created_at: string;
    likes_count: number;
}

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

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        bible_verse: '',
        author: '',
        category: 'inspiration',
        scheduled_date: new Date(),
        is_published: false,
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
            // Simulate API call
            setTimeout(() => {
                setDailyStrengths([
                    {
                        id: '1',
                        title: 'Morning Blessings',
                        content: 'Start your day with gratitude and watch how blessings flow into your life.',
                        bible_verse: 'Psalm 118:24',
                        author: 'Sarah Johnson',
                        category: 'inspiration',
                        scheduled_date: new Date().toISOString(),
                        is_published: true,
                        created_at: new Date().toISOString(),
                        likes_count: 45,
                    },
                    {
                        id: '2',
                        title: 'Strength in Faith',
                        content: 'When you feel weak, remember that faith gives you strength beyond your own.',
                        bible_verse: 'Isaiah 40:31',
                        author: 'Michael Chen',
                        category: 'faith',
                        scheduled_date: new Date(Date.now() + 86400000).toISOString(),
                        is_published: false,
                        created_at: new Date().toISOString(),
                        likes_count: 0,
                    }
                ]);
                setLoading(false);
            }, 1000);
        } catch (error) {
            console.error('Error loading daily strengths:', error);
            Alert.alert('Error', 'Failed to load daily strengths');
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
            content: '',
            bible_verse: '',
            author: '',
            category: 'inspiration',
            scheduled_date: new Date(),
            is_published: false,
        });
        setEditingStrength(null);
    };

    const openAddModal = () => {
        resetForm();
        setModalVisible(true);
    };

    const openEditModal = (strength: DailyStrength) => {
        setFormData({
            title: strength.title,
            content: strength.content,
            bible_verse: strength.bible_verse || '',
            author: strength.author || '',
            category: strength.category,
            scheduled_date: new Date(strength.scheduled_date),
            is_published: strength.is_published,
        });
        setEditingStrength(strength);
        setModalVisible(true);
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setFormData(prev => ({ ...prev, scheduled_date: selectedDate }));
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.title || !formData.content) {
            Alert.alert('Error', 'Please fill in title and content');
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
        const newStrength: DailyStrength = {
            id: Date.now().toString(),
            title: formData.title,
            content: formData.content,
            bible_verse: formData.bible_verse,
            author: formData.author,
            category: formData.category,
            scheduled_date: formData.scheduled_date.toISOString(),
            is_published: formData.is_published,
            created_at: new Date().toISOString(),
            likes_count: 0,
        };

        // Simulate API call
        console.log('Adding daily strength:', newStrength);
        Alert.alert('Success', 'Daily strength added successfully!');
    };

    const updateStrength = async () => {
        if (!editingStrength) return;

        const updatedStrength: DailyStrength = {
            ...editingStrength,
            title: formData.title,
            content: formData.content,
            bible_verse: formData.bible_verse,
            author: formData.author,
            category: formData.category,
            scheduled_date: formData.scheduled_date.toISOString(),
            is_published: formData.is_published,
        };

        // Simulate API call
        console.log('Updating daily strength:', updatedStrength);
        Alert.alert('Success', 'Daily strength updated successfully!');
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
            // Simulate API call
            console.log('Deleting daily strength:', strengthId);
            setDailyStrengths(dailyStrengths.filter(strength => strength.id !== strengthId));
            Alert.alert('Success', 'Daily strength deleted successfully!');
        } catch (error) {
            console.error('Error deleting daily strength:', error);
            Alert.alert('Error', 'Failed to delete daily strength');
        }
    };

    const togglePublishStatus = async (strength: DailyStrength) => {
        try {
            const updatedStrength = { ...strength, is_published: !strength.is_published };
            // Simulate API call
            console.log('Toggling publish status:', updatedStrength);
            setDailyStrengths(dailyStrengths.map(s => s.id === strength.id ? updatedStrength : s));

            Alert.alert(
                'Success',
                updatedStrength.is_published
                    ? 'Daily strength published!'
                    : 'Daily strength unpublished!'
            );
        } catch (error) {
            console.error('Error toggling publish status:', error);
            Alert.alert('Error', 'Failed to update publish status');
        }
    };

    const getCategoryColor = (category: string) => {
        const colors: { [key: string]: string } = {
            inspiration: '#6366f1',
            scripture: '#10b981',
            prayer: '#ef4444',
            reflection: '#f59e0b',
            encouragement: '#8b5cf6',
            faith: '#06b6d4',
            hope: '#ec4899',
            love: '#dc2626',
        };
        return colors[category] || theme.colors.accentPrimary;
    };

    const StrengthCard = ({ strength }: { strength: DailyStrength }) => (
        <View style={[
            theme.card,
            {
                marginBottom: theme.Spacing.md,
                opacity: strength.is_published ? 1 : 0.7,
                borderLeftWidth: 4,
                borderLeftColor: getCategoryColor(strength.category),
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
                        {strength.title}
                    </Text>

                    <Text style={{
                        fontSize: 14,
                        color: theme.colors.textSecondary,
                        lineHeight: 20,
                        marginBottom: 8,
                    }} numberOfLines={3}>
                        {strength.content}
                    </Text>

                    <View style={{
                        flexDirection: 'row' as 'row',
                        flexWrap: 'wrap' as 'wrap',
                        gap: theme.Spacing.sm,
                        marginBottom: 8
                    }}>
                        <View style={{
                            backgroundColor: getCategoryColor(strength.category) + '20',
                            paddingHorizontal: theme.Spacing.sm,
                            paddingVertical: 2,
                            borderRadius: theme.BorderRadius.round,
                        }}>
                            <Text style={{
                                fontSize: 10,
                                color: getCategoryColor(strength.category),
                                fontWeight: '500' as '500',
                                textTransform: 'capitalize',
                            }}>
                                {strength.category}
                            </Text>
                        </View>

                        {strength.bible_verse && (
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
                                    📖 {strength.bible_verse}
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
                            {formatDate(new Date(strength.scheduled_date))}
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
                                    name="heart"
                                    size={12}
                                    color={theme.colors.textSecondary}
                                />
                                <Text style={{
                                    fontSize: 12,
                                    color: theme.colors.textSecondary,
                                    marginLeft: 2,
                                }}>
                                    {strength.likes_count}
                                </Text>
                            </View>

                            <View style={{
                                flexDirection: 'row' as 'row',
                                alignItems: 'center' as 'center'
                            }}>
                                <Ionicons
                                    name={strength.is_published ? "eye" : "eye-off"}
                                    size={12}
                                    color={strength.is_published ? theme.colors.success : theme.colors.textSecondary}
                                />
                                <Text style={{
                                    fontSize: 12,
                                    color: strength.is_published ? theme.colors.success : theme.colors.textSecondary,
                                    marginLeft: 2,
                                }}>
                                    {strength.is_published ? 'Published' : 'Draft'}
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
                            name={strength.is_published ? "eye-off-outline" : "eye-outline"}
                            size={20}
                            color={strength.is_published ? theme.colors.warning : theme.colors.success}
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

                            {/* Content */}
                            <View>
                                <Text style={createLabelStyle(theme)}>Content *</Text>
                                <TextInput
                                    style={[theme.input, { height: 120, textAlignVertical: 'top' }]}
                                    value={formData.content}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, content: text }))}
                                    placeholder="Write your inspirational message..."
                                    multiline
                                    numberOfLines={5}
                                />
                            </View>

                            {/* Bible Verse */}
                            <View>
                                <Text style={createLabelStyle(theme)}>Bible Verse (Optional)</Text>
                                <TextInput
                                    style={theme.input}
                                    value={formData.bible_verse}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, bible_verse: text }))}
                                    placeholder="e.g., John 3:16"
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

                            {/* Category */}
                            <View>
                                <Text style={createLabelStyle(theme)}>Category</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View style={{
                                        flexDirection: 'row' as 'row',
                                        gap: theme.Spacing.sm
                                    }}>
                                        {categories.map(cat => (
                                            <TouchableOpacity
                                                key={cat}
                                                onPress={() => setFormData(prev => ({ ...prev, category: cat }))}
                                                style={{
                                                    paddingHorizontal: theme.Spacing.md,
                                                    paddingVertical: theme.Spacing.sm,
                                                    borderRadius: theme.BorderRadius.round,
                                                    backgroundColor: formData.category === cat
                                                        ? getCategoryColor(cat)
                                                        : theme.colors.backgroundCard,
                                                    borderWidth: 1,
                                                    borderColor: formData.category === cat
                                                        ? getCategoryColor(cat)
                                                        : theme.colors.border,
                                                }}
                                            >
                                                <Text style={{
                                                    fontSize: 12,
                                                    fontWeight: '500' as '500',
                                                    color: formData.category === cat
                                                        ? theme.colors.textInverse
                                                        : theme.colors.textSecondary,
                                                    textTransform: 'capitalize',
                                                }}>
                                                    {cat}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>

                            {/* Scheduled Date */}
                            <View>
                                <Text style={createLabelStyle(theme)}>Scheduled Date</Text>
                                <TouchableOpacity
                                    style={theme.input}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Text style={{ color: theme.colors.text }}>
                                        {formatDate(formData.scheduled_date)}
                                    </Text>
                                </TouchableOpacity>
                                {showDatePicker && (
                                    <DateTimePicker
                                        value={formData.scheduled_date}
                                        mode="date"
                                        display="default"
                                        onChange={handleDateChange}
                                        minimumDate={new Date()}
                                    />
                                )}
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
                                        value={formData.is_published}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, is_published: value }))}
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