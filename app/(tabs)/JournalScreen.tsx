// app/(tabs)/JournalScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Modal,
    Alert,
    ActivityIndicator,
    RefreshControl,
    Animated,
    Easing,
    Dimensions,
    StatusBar,
} from 'react-native';
import { useTheme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { journalService } from '../../services/journalService';
import { JournalEntry, MoodType } from '../../types/journal';
import { useFocusEffect } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type MoodIconName =
    | 'happy-outline'
    | 'sad-outline'
    | 'alert-circle-outline'
    | 'leaf-outline'
    | 'heart-outline'
    | 'eye-outline'
    | 'rocket-outline'
    | 'bed-outline'
    | 'flash-outline'
    | 'ellipse-outline';

type JournalIconName =
    | MoodIconName
    | 'journal-outline'
    | 'add'
    | 'trash-outline'
    | 'search-outline'
    | 'close-outline'
    | 'filter-outline'
    | 'stats-chart-outline'
    | 'calendar-outline';

interface MoodStats {
    mood: MoodType;
    count: number;
    percentage: number;
}

export default function JournalScreen() {
    const theme = useTheme();
    const { user } = useAuth();

    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showEditor, setShowEditor] = useState(false);
    const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [selectedMoodFilter, setSelectedMoodFilter] = useState<MoodType | 'all'>('all');
    const [showStats, setShowStats] = useState(false);
    const [moodStats, setMoodStats] = useState<MoodStats[]>([]);

    // Form state
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedMood, setSelectedMood] = useState<MoodType>('neutral');
    const [saving, setSaving] = useState(false);

    // Track original values for comparison when editing
    const [originalEntry, setOriginalEntry] = useState<{
        title?: string;
        content: string;
        mood: MoodType;
    } | null>(null);

    // Animations
    const fadeAnim = useState(new Animated.Value(0))[0];
    const slideAnim = useState(new Animated.Value(20))[0];
    const scaleAnim = useState(new Animated.Value(0.9))[0];

    useEffect(() => {
        loadEntries();
    }, []);

    useFocusEffect(
        useCallback(() => {
            // Refresh data when screen comes into focus
            if (entries.length > 0) {
                loadEntries();
            }
        }, [entries.length])
    );

    useEffect(() => {
        filterEntries();
        calculateMoodStats();
    }, [entries, searchQuery, selectedMoodFilter]);

    const loadEntries = async () => {
        if (!user) {
            console.log('No user found');
            return;
        }

        try {
            setLoading(true);
            const data = await journalService.getEntries();
            setEntries(data);

            // Animate in when data loads
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 600,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 600,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                })
            ]).start();
        } catch (error) {
            console.error('Error loading entries:', error);
            Alert.alert('Error', 'Failed to load journal entries. Please check your connection.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const filterEntries = () => {
        let filtered = entries;

        // Apply search filter
        if (searchQuery.trim()) {
            filtered = filtered.filter(entry =>
                entry.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                entry.content.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply mood filter
        if (selectedMoodFilter !== 'all') {
            filtered = filtered.filter(entry => entry.mood === selectedMoodFilter);
        }

        setFilteredEntries(filtered);
    };

    const calculateMoodStats = () => {
        const moodCounts: Record<MoodType, number> = {
            happy: 0, sad: 0, anxious: 0, peaceful: 0, grateful: 0,
            reflective: 0, hopeful: 0, tired: 0, excited: 0, neutral: 0
        };

        entries.forEach(entry => {
            if (entry.mood && moodCounts[entry.mood as MoodType] !== undefined) {
                moodCounts[entry.mood as MoodType]++;
            }
        });

        const totalEntries = entries.length;
        const stats: MoodStats[] = Object.entries(moodCounts)
            .filter(([_, count]) => count > 0)
            .map(([mood, count]) => ({
                mood: mood as MoodType,
                count,
                percentage: totalEntries > 0 ? (count / totalEntries) * 100 : 0
            }))
            .sort((a, b) => b.count - a.count);

        setMoodStats(stats);
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadEntries();
    };

    const openEditor = (entry?: JournalEntry) => {
        if (entry) {
            setEditingEntry(entry);
            setTitle(entry.title || '');
            setContent(entry.content);
            setSelectedMood((entry.mood as MoodType) || 'neutral');
            // Store original values for comparison
            setOriginalEntry({
                title: entry.title || '',
                content: entry.content,
                mood: (entry.mood as MoodType) || 'neutral'
            });
        } else {
            setEditingEntry(null);
            setTitle('');
            setContent('');
            setSelectedMood('neutral');
            setOriginalEntry(null);
        }
        setShowEditor(true);
    };

    const closeEditor = (forceClose: boolean = false) => {
        // If we're saving or force closing, don't show the warning
        if (saving || forceClose) {
            setShowEditor(false);
            resetEditor();
            return;
        }

        // Check if there are unsaved changes
        const hasUnsavedChanges = checkForUnsavedChanges();

        if (hasUnsavedChanges) {
            Alert.alert(
                'Unsaved Changes',
                'You have unsaved changes. Are you sure you want to discard them?',
                [
                    { text: 'Keep Editing', style: 'cancel' },
                    {
                        text: 'Discard',
                        style: 'destructive',
                        onPress: () => {
                            setShowEditor(false);
                            resetEditor();
                        }
                    },
                ]
            );
        } else {
            // No unsaved changes, just close
            setShowEditor(false);
            resetEditor();
        }
    };

    const checkForUnsavedChanges = (): boolean => {
        if (editingEntry && originalEntry) {
            // Check if any field has changed when editing
            return title !== originalEntry.title ||
                content !== originalEntry.content ||
                selectedMood !== originalEntry.mood;
        } else {
            // For new entries, check if there's any content
            return content.trim().length > 0 || title.trim().length > 0;
        }
    };

    const resetEditor = () => {
        setEditingEntry(null);
        setTitle('');
        setContent('');
        setSelectedMood('neutral');
        setSaving(false);
        setOriginalEntry(null);
    };

    const saveEntry = async () => {
        if (!content.trim()) {
            Alert.alert('Error', 'Please write something in your journal entry');
            return;
        }

        if (!user) {
            Alert.alert('Error', 'Please sign in to save journal entries');
            return;
        }

        setSaving(true);
        try {
            const entryData = {
                title: title.trim() || undefined,
                content: content.trim(),
                mood: selectedMood,
                tags: [],
            };

            if (editingEntry) {
                await journalService.updateEntry(editingEntry.id, entryData);
            } else {
                await journalService.createEntry(entryData);
            }

            // Use forceClose to bypass the unsaved changes warning
            closeEditor(true);
            loadEntries();
        } catch (error: any) {
            console.error('Error saving entry:', error);
            Alert.alert('Error', 'Failed to save journal entry. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const deleteEntry = (entry: JournalEntry) => {
        Alert.alert(
            'Delete Entry',
            'Are you sure you want to delete this journal entry? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await journalService.deleteEntry(entry.id);
                            loadEntries();
                        } catch (error) {
                            console.error('Error deleting entry:', error);
                            Alert.alert('Error', 'Failed to delete journal entry');
                        }
                    },
                },
            ]
        );
    };

    const getMoodIcon = (mood: MoodType): MoodIconName => {
        const moodIcons: Record<MoodType, MoodIconName> = {
            happy: 'happy-outline',
            sad: 'sad-outline',
            anxious: 'alert-circle-outline',
            peaceful: 'leaf-outline',
            grateful: 'heart-outline',
            reflective: 'eye-outline',
            hopeful: 'rocket-outline',
            tired: 'bed-outline',
            excited: 'flash-outline',
            neutral: 'ellipse-outline',
        };
        return moodIcons[mood];
    };

    const getMoodColor = (mood: MoodType) => {
        const moodColors = {
            happy: '#10B981',
            sad: '#3B82F6',
            anxious: '#F59E0B',
            peaceful: '#8B5CF6',
            grateful: '#EC4899',
            reflective: '#06B6D4',
            hopeful: '#84CC16',
            tired: '#6B7280',
            excited: '#DC2626',
            neutral: theme.colors.textSecondary,
        };
        return moodColors[mood];
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
            });
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    const getWordCount = (text: string) => {
        return text.trim() ? text.trim().split(/\s+/).length : 0;
    };

    const moodOptions: MoodType[] = [
        'happy', 'sad', 'anxious', 'peaceful', 'grateful',
        'reflective', 'hopeful', 'tired', 'excited', 'neutral'
    ];

    const moodFilterOptions: (MoodType | 'all')[] = ['all', ...moodOptions];

    if (loading && entries.length === 0) {
        return (
            <View style={[theme.screen, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
                <Text style={{ marginTop: theme.Spacing.md, color: theme.colors.text }}>
                    Loading your journal...
                </Text>
            </View>
        );
    }

    return (
        <View style={theme.screen}>
            <StatusBar barStyle={theme.colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={{
                paddingHorizontal: theme.Spacing.md,
                paddingVertical: theme.Spacing.lg,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
            }}>
                <View style={[theme.rowBetween, { marginBottom: theme.Spacing.sm }]}>
                    <Text style={{
                        fontSize: 28,
                        fontWeight: 'bold',
                        color: theme.colors.text,
                    }}>
                        My Journal
                    </Text>
                    <View style={{ flexDirection: 'row', gap: theme.Spacing.sm }}>
                        <TouchableOpacity
                            onPress={() => setShowStats(true)}
                            style={{
                                padding: theme.Spacing.sm,
                                backgroundColor: theme.colors.accentPrimary + '15',
                                borderRadius: theme.BorderRadius.round,
                            }}
                        >
                            <Ionicons name="stats-chart-outline" size={20} color={theme.colors.accentPrimary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setShowSearch(!showSearch)}
                            style={{
                                padding: theme.Spacing.sm,
                                backgroundColor: theme.colors.accentPrimary + '15',
                                borderRadius: theme.BorderRadius.round,
                            }}
                        >
                            <Ionicons name="search-outline" size={20} color={theme.colors.accentPrimary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search Bar */}
                {showSearch && (
                    <Animated.View
                        style={{
                            marginTop: theme.Spacing.sm,
                        }}
                    >
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: theme.colors.backgroundCard,
                            borderRadius: theme.BorderRadius.md,
                            paddingHorizontal: theme.Spacing.md,
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                        }}>
                            <Ionicons name="search-outline" size={18} color={theme.colors.textSecondary} />
                            <TextInput
                                style={{
                                    flex: 1,
                                    padding: theme.Spacing.md,
                                    fontSize: 16,
                                    color: theme.colors.text,
                                }}
                                placeholder="Search journal entries..."
                                placeholderTextColor={theme.colors.textSecondary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus
                            />
                            {searchQuery ? (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <Ionicons name="close-outline" size={18} color={theme.colors.textSecondary} />
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </Animated.View>
                )}

                {/* Mood Filter */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginTop: theme.Spacing.sm }}
                    contentContainerStyle={{ paddingRight: theme.Spacing.md }}
                >
                    <View style={{ flexDirection: 'row', gap: theme.Spacing.xs }}>
                        {moodFilterOptions.map((mood) => (
                            <TouchableOpacity
                                key={mood}
                                onPress={() => setSelectedMoodFilter(mood)}
                                style={{
                                    paddingHorizontal: theme.Spacing.md,
                                    paddingVertical: theme.Spacing.xs,
                                    borderRadius: theme.BorderRadius.round,
                                    backgroundColor: selectedMoodFilter === mood
                                        ? mood === 'all' ? theme.colors.accentPrimary : getMoodColor(mood as MoodType)
                                        : theme.colors.backgroundCard,
                                    borderWidth: 1,
                                    borderColor: selectedMoodFilter === mood
                                        ? 'transparent'
                                        : theme.colors.border,
                                }}
                            >
                                <Text style={{
                                    fontSize: 12,
                                    fontWeight: '500',
                                    color: selectedMoodFilter === mood ? theme.colors.textInverse : theme.colors.textSecondary,
                                    textTransform: 'capitalize',
                                }}>
                                    {mood === 'all' ? 'All Moods' : mood}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </View>

            {/* Action Button */}
            <TouchableOpacity
                onPress={() => openEditor()}
                style={[{
                    position: 'absolute',
                    bottom: theme.Spacing.xl,
                    right: theme.Spacing.xl,
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: theme.colors.accentPrimary,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8,
                    zIndex: 1000,
                }]}
            >
                <Ionicons name="add" size={24} color={theme.colors.textInverse} />
            </TouchableOpacity>

            {/* Journal Entries List */}
            {filteredEntries.length === 0 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.Spacing.xl }}>
                    <Ionicons
                        name={searchQuery || selectedMoodFilter !== 'all' ? "search-outline" : "journal-outline"}
                        size={64}
                        color={theme.colors.textSecondary}
                    />
                    <Text style={{
                        fontSize: 18,
                        fontWeight: '600',
                        color: theme.colors.text,
                        marginTop: theme.Spacing.lg,
                        textAlign: 'center',
                    }}>
                        {searchQuery ? 'No matching entries' :
                            selectedMoodFilter !== 'all' ? `No ${selectedMoodFilter} entries` :
                                'No journal entries yet'}
                    </Text>
                    <Text style={{
                        fontSize: 14,
                        color: theme.colors.textSecondary,
                        marginTop: theme.Spacing.sm,
                        textAlign: 'center',
                        lineHeight: 20,
                    }}>
                        {searchQuery ? 'Try a different search term' :
                            selectedMoodFilter !== 'all' ? 'Try selecting a different mood filter' :
                                'Start writing your thoughts and reflections.\nYour journal is private and secure.'}
                    </Text>
                    {!searchQuery && selectedMoodFilter === 'all' && (
                        <TouchableOpacity
                            onPress={() => openEditor()}
                            style={[theme.button, { marginTop: theme.Spacing.lg }]}
                        >
                            <Text style={theme.buttonText}>Write Your First Entry</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <Animated.ScrollView
                    style={{ flex: 1 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={[theme.colors.accentPrimary]}
                            tintColor={theme.colors.accentPrimary}
                        />
                    }
                    contentContainerStyle={{ padding: theme.Spacing.md, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                >
                    {filteredEntries.map((entry, index) => (
                        <Animated.View
                            key={entry.id}
                            style={[
                                theme.card,
                                {
                                    marginBottom: theme.Spacing.md,
                                    opacity: fadeAnim,
                                    transform: [
                                        { translateY: slideAnim },
                                        { scale: scaleAnim }
                                    ],
                                }
                            ]}
                        >
                            <TouchableOpacity
                                onPress={() => openEditor(entry)}
                                onLongPress={() => deleteEntry(entry)}
                                activeOpacity={0.7}
                            >
                                <View style={[theme.rowBetween, { marginBottom: theme.Spacing.sm }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.xs }}>
                                        <Ionicons
                                            name={getMoodIcon((entry.mood as MoodType) || 'neutral')}
                                            size={16}
                                            color={getMoodColor((entry.mood as MoodType) || 'neutral')}
                                        />
                                        <Text style={{
                                            fontSize: 12,
                                            color: getMoodColor((entry.mood as MoodType) || 'neutral'),
                                            fontWeight: '600',
                                            textTransform: 'capitalize',
                                        }}>
                                            {(entry.mood as MoodType) || 'neutral'}
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.sm }}>
                                        <Text style={{
                                            fontSize: 11,
                                            color: theme.colors.textSecondary,
                                        }}>
                                            {formatTime(entry.created_at)}
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => deleteEntry(entry)}
                                            style={{ padding: theme.Spacing.xs }}
                                        >
                                            <Ionicons name="trash-outline" size={14} color={theme.colors.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <Text style={{
                                    fontSize: 12,
                                    color: theme.colors.textSecondary,
                                    marginBottom: theme.Spacing.sm,
                                    fontWeight: '500',
                                }}>
                                    {formatDate(entry.created_at)}
                                </Text>

                                {entry.title && (
                                    <Text style={{
                                        fontSize: 18,
                                        fontWeight: '600',
                                        color: theme.colors.text,
                                        marginBottom: theme.Spacing.xs,
                                    }}>
                                        {entry.title}
                                    </Text>
                                )}

                                <Text
                                    style={{
                                        fontSize: 14,
                                        color: theme.colors.text,
                                        lineHeight: 20,
                                    }}
                                    numberOfLines={4}
                                >
                                    {entry.content}
                                </Text>

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.Spacing.sm }}>
                                    <Text style={{
                                        fontSize: 11,
                                        color: theme.colors.textSecondary,
                                    }}>
                                        {getWordCount(entry.content)} words
                                    </Text>
                                    <Text style={{
                                        fontSize: 11,
                                        color: theme.colors.textSecondary,
                                    }}>
                                        Read more
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </Animated.ScrollView>
            )}

            {/* Journal Editor Modal */}
            <Modal
                visible={showEditor}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => closeEditor()}
            >
                <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
                    {/* Editor Header */}
                    <View style={[theme.rowBetween, {
                        paddingHorizontal: theme.Spacing.md,
                        paddingVertical: theme.Spacing.lg,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.border,
                    }]}>
                        <TouchableOpacity
                            onPress={() => closeEditor()}
                            disabled={saving}
                        >
                            <Text style={{
                                color: saving ? theme.colors.textSecondary : theme.colors.text,
                                fontSize: 16
                            }}>
                                Cancel
                            </Text>
                        </TouchableOpacity>

                        <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text }}>
                                {editingEntry ? 'Edit Entry' : 'New Entry'}
                            </Text>
                            <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 }}>
                                {getWordCount(content)} words
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={saveEntry}
                            disabled={saving || !content.trim()}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color={theme.colors.accentPrimary} />
                            ) : (
                                <Text style={{
                                    color: content.trim() ? theme.colors.accentPrimary : theme.colors.textSecondary,
                                    fontSize: 16,
                                    fontWeight: '600'
                                }}>
                                    {editingEntry ? 'Update' : 'Save'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Editor Content */}
                    <ScrollView style={{ flex: 1, padding: theme.Spacing.md }}>
                        {/* Title Input */}
                        <TextInput
                            style={[{
                                backgroundColor: theme.colors.backgroundCard,
                                borderWidth: 1,
                                borderColor: theme.colors.border,
                                borderRadius: theme.BorderRadius.md,
                                padding: theme.Spacing.md,
                                fontSize: 18,
                                color: theme.colors.text,
                                marginBottom: theme.Spacing.lg,
                                fontWeight: '600',
                            }]}
                            placeholder="Title (optional)"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={title}
                            onChangeText={setTitle}
                        />

                        {/* Mood Selection */}
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '500',
                            color: theme.colors.text,
                            marginBottom: theme.Spacing.sm,
                        }}>
                            How are you feeling?
                        </Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={{ marginBottom: theme.Spacing.lg }}
                            contentContainerStyle={{ paddingRight: theme.Spacing.md }}
                        >
                            <View style={{ flexDirection: 'row', gap: theme.Spacing.sm }}>
                                {moodOptions.map((mood) => (
                                    <TouchableOpacity
                                        key={mood}
                                        onPress={() => setSelectedMood(mood)}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: theme.Spacing.xs,
                                            paddingHorizontal: theme.Spacing.md,
                                            paddingVertical: theme.Spacing.sm,
                                            borderRadius: theme.BorderRadius.round,
                                            backgroundColor: selectedMood === mood
                                                ? getMoodColor(mood) + '20'
                                                : 'transparent',
                                            borderWidth: 2,
                                            borderColor: selectedMood === mood
                                                ? getMoodColor(mood)
                                                : theme.colors.border,
                                        }}
                                    >
                                        <Ionicons
                                            name={getMoodIcon(mood)}
                                            size={16}
                                            color={getMoodColor(mood)}
                                        />
                                        <Text style={{
                                            fontSize: 12,
                                            fontWeight: '500',
                                            color: getMoodColor(mood),
                                            textTransform: 'capitalize',
                                        }}>
                                            {mood}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        {/* Content Input */}
                        <TextInput
                            style={[{
                                backgroundColor: theme.colors.backgroundCard,
                                borderWidth: 1,
                                borderColor: theme.colors.border,
                                borderRadius: theme.BorderRadius.md,
                                padding: theme.Spacing.md,
                                fontSize: 16,
                                color: theme.colors.text,
                                minHeight: 300,
                                textAlignVertical: 'top',
                                lineHeight: 24,
                            }]}
                            placeholder="Write your thoughts here... (required)"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={content}
                            onChangeText={setContent}
                            multiline
                            numberOfLines={15}
                        />
                    </ScrollView>
                </View>
            </Modal>

            {/* Mood Statistics Modal */}
            <Modal
                visible={showStats}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowStats(false)}
            >
                <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
                    <View style={[theme.rowBetween, {
                        paddingHorizontal: theme.Spacing.md,
                        paddingVertical: theme.Spacing.lg,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.border,
                    }]}>
                        <Text style={{ fontSize: 20, fontWeight: '600', color: theme.colors.text }}>
                            Mood Insights
                        </Text>
                        <TouchableOpacity onPress={() => setShowStats(false)}>
                            <Ionicons name="close-outline" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ flex: 1, padding: theme.Spacing.md }}>
                        <View style={[theme.card, { marginBottom: theme.Spacing.lg }]}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text, marginBottom: theme.Spacing.md }}>
                                Total Entries: {entries.length}
                            </Text>

                            {moodStats.map((stat, index) => (
                                <View key={stat.mood} style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: theme.Spacing.md,
                                    padding: theme.Spacing.sm,
                                    backgroundColor: getMoodColor(stat.mood) + '10',
                                    borderRadius: theme.BorderRadius.md,
                                }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.sm, flex: 1 }}>
                                        <Ionicons
                                            name={getMoodIcon(stat.mood)}
                                            size={20}
                                            color={getMoodColor(stat.mood)}
                                        />
                                        <Text style={{
                                            fontSize: 14,
                                            fontWeight: '500',
                                            color: getMoodColor(stat.mood),
                                            textTransform: 'capitalize',
                                            flex: 1,
                                        }}>
                                            {stat.mood}
                                        </Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}>
                                            {stat.count} {stat.count === 1 ? 'entry' : 'entries'}
                                        </Text>
                                        <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                                            {stat.percentage.toFixed(1)}%
                                        </Text>
                                    </View>
                                </View>
                            ))}

                            {moodStats.length === 0 && (
                                <Text style={{ textAlign: 'center', color: theme.colors.textSecondary, padding: theme.Spacing.lg }}>
                                    No mood data available yet. Start writing to see insights!
                                </Text>
                            )}
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}