// app/admin/ManageCuratedPrayers.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Modal,
    TextInput,
    RefreshControl,
} from 'react-native';
import { useTheme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { adminPrayerService, CuratedPrayer, CreateCuratedPrayer } from '../../services/adminPrayerService';

export default function ManageCuratedPrayers() {
    const theme = useTheme();
    const [curatedPrayers, setCuratedPrayers] = useState<CuratedPrayer[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingPrayer, setEditingPrayer] = useState<CuratedPrayer | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('');
    const [type, setType] = useState<'prayer' | 'scripture' | 'blessing'>('prayer');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadCuratedPrayers();
    }, []);

    const loadCuratedPrayers = async () => {
        try {
            setLoading(true);
            const prayers = await adminPrayerService.getCuratedPrayers();
            setCuratedPrayers(prayers);
        } catch (error) {
            console.error('Error loading curated prayers:', error);
            Alert.alert('Error', 'Failed to load curated prayers');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadCuratedPrayers();
    };

    const openCreateModal = () => {
        setEditingPrayer(null);
        setTitle('');
        setContent('');
        setCategory('');
        setType('prayer');
        setModalVisible(true);
    };

    const openEditModal = (prayer: CuratedPrayer) => {
        setEditingPrayer(prayer);
        setTitle(prayer.title);
        setContent(prayer.content);
        setCategory(prayer.category || '');
        setType(prayer.type);
        setModalVisible(true);
    };

    const submitCuratedPrayer = async () => {
        if (!title.trim() || !content.trim()) {
            Alert.alert('Error', 'Please fill in both title and content');
            return;
        }

        setSubmitting(true);
        try {
            const prayerData: CreateCuratedPrayer = {
                title: title.trim(),
                content: content.trim(),
                category: category.trim() || undefined, // FIX: Use undefined instead of null
                type,
            };

            if (editingPrayer) {
                // Update existing
                const updatedPrayer = await adminPrayerService.updateCuratedPrayer(editingPrayer.id, prayerData);
                setCuratedPrayers(curatedPrayers.map(p => p.id === editingPrayer.id ? updatedPrayer : p));
                Alert.alert('Success', 'Curated prayer updated successfully');
            } else {
                // Create new
                const newPrayer = await adminPrayerService.createCuratedPrayer(prayerData);
                setCuratedPrayers([newPrayer, ...curatedPrayers]);
                Alert.alert('Success', 'Curated prayer created successfully');
            }

            setModalVisible(false);
        } catch (error) {
            console.error('Error submitting curated prayer:', error);
            Alert.alert('Error', `Failed to ${editingPrayer ? 'update' : 'create'} curated prayer`);
        } finally {
            setSubmitting(false);
        }
    };

    const deleteCuratedPrayer = async (prayer: CuratedPrayer) => {
        Alert.alert(
            'Delete Curated Prayer',
            `Are you sure you want to delete "${prayer.title}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => confirmDelete(prayer.id)
                }
            ]
        );
    };

    const confirmDelete = async (prayerId: string) => {
        setActionLoading(prayerId);
        try {
            await adminPrayerService.deleteCuratedPrayer(prayerId);
            setCuratedPrayers(curatedPrayers.filter(prayer => prayer.id !== prayerId));
            Alert.alert('Success', 'Curated prayer deleted successfully');
        } catch (error) {
            console.error('Error deleting curated prayer:', error);
            Alert.alert('Error', 'Failed to delete curated prayer');
        } finally {
            setActionLoading(null);
        }
    };

    const togglePrayerActive = async (prayer: CuratedPrayer) => {
        setActionLoading(prayer.id);
        try {
            const updatedPrayer = await adminPrayerService.updateCuratedPrayer(prayer.id, {
                is_active: !prayer.is_active
            });
            setCuratedPrayers(curatedPrayers.map(p => p.id === prayer.id ? updatedPrayer : p));
        } catch (error) {
            console.error('Error toggling prayer active:', error);
            Alert.alert('Error', 'Failed to update prayer status');
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const CuratedPrayerCard = ({ prayer }: { prayer: CuratedPrayer }) => (
        <View style={[
            theme.card,
            {
                marginBottom: theme.Spacing.md,
                opacity: prayer.is_active ? 1 : 0.6,
            }
        ]}>
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
            }}>
                <View style={{ flex: 1 }}>
                    <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: theme.colors.text,
                        marginBottom: theme.Spacing.xs,
                    }}>
                        {prayer.title}
                    </Text>

                    {prayer.category && (
                        <Text style={{
                            fontSize: 12,
                            color: theme.colors.accentPrimary,
                            marginBottom: theme.Spacing.xs,
                        }}>
                            {prayer.category}
                        </Text>
                    )}

                    <Text style={{
                        fontSize: 14,
                        color: theme.colors.textSecondary,
                        lineHeight: 20,
                        marginBottom: theme.Spacing.sm,
                    }} numberOfLines={3}>
                        {prayer.content}
                    </Text>

                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: theme.Spacing.sm,
                        }}>
                            <View style={{
                                backgroundColor: theme.colors.accentPrimary + '20',
                                paddingHorizontal: theme.Spacing.sm,
                                paddingVertical: 2,
                                borderRadius: theme.BorderRadius.round,
                            }}>
                                <Text style={{
                                    fontSize: 10,
                                    color: theme.colors.accentPrimary,
                                    fontWeight: '500',
                                    textTransform: 'capitalize',
                                }}>
                                    {prayer.type}
                                </Text>
                            </View>

                            <View style={{
                                backgroundColor: prayer.is_active ? theme.colors.success + '20' : theme.colors.error + '20',
                                paddingHorizontal: theme.Spacing.sm,
                                paddingVertical: 2,
                                borderRadius: theme.BorderRadius.round,
                            }}>
                                <Text style={{
                                    fontSize: 10,
                                    color: prayer.is_active ? theme.colors.success : theme.colors.error,
                                    fontWeight: '500',
                                }}>
                                    {prayer.is_active ? 'Active' : 'Inactive'}
                                </Text>
                            </View>
                        </View>

                        <Text style={{
                            fontSize: 10,
                            color: theme.colors.textSecondary,
                        }}>
                            {formatDate(prayer.created_at)}
                        </Text>
                    </View>
                </View>

                <View style={{
                    alignItems: 'flex-end',
                    gap: theme.Spacing.sm,
                    marginLeft: theme.Spacing.sm,
                }}>
                    {actionLoading === prayer.id ? (
                        <ActivityIndicator size="small" color={theme.colors.accentPrimary} />
                    ) : (
                        <>
                            <TouchableOpacity
                                onPress={() => openEditModal(prayer)}
                                style={{ padding: theme.Spacing.xs }}
                            >
                                <Ionicons name="create-outline" size={18} color={theme.colors.accentPrimary} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => togglePrayerActive(prayer)}
                                style={{ padding: theme.Spacing.xs }}
                            >
                                <Ionicons
                                    name={prayer.is_active ? "eye-off-outline" : "eye-outline"}
                                    size={18}
                                    color={prayer.is_active ? theme.colors.warning : theme.colors.success}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => deleteCuratedPrayer(prayer)}
                                style={{ padding: theme.Spacing.xs }}
                            >
                                <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={[theme.screen, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
                <Text style={{ marginTop: theme.Spacing.md, color: theme.colors.text }}>
                    Loading curated prayers...
                </Text>
            </View>
        );
    }

    return (
        <View style={theme.screen}>
            {/* Header */}
            <View style={{
                padding: theme.Spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
            }}>
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: theme.Spacing.md,
                }}>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: 'bold',
                        color: theme.colors.text,
                    }}>
                        Curated Prayers ({curatedPrayers.length})
                    </Text>

                    <TouchableOpacity
                        onPress={openCreateModal}
                        style={[theme.button, {
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: theme.Spacing.xs,
                        }]}
                    >
                        <Ionicons name="add" size={16} color={theme.colors.textInverse} />
                        <Text style={[theme.buttonText, { fontSize: 14 }]}>Add Prayer</Text>
                    </TouchableOpacity>
                </View>

                <Text style={{
                    fontSize: 12,
                    color: theme.colors.textSecondary,
                }}>
                    Create and manage inspirational prayers for all users
                </Text>
            </View>

            {/* Prayers List */}
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
                {curatedPrayers.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: theme.Spacing.xl }}>
                        <Ionicons name="book-outline" size={64} color={theme.colors.textSecondary} />
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '600',
                            color: theme.colors.text,
                            marginTop: theme.Spacing.lg,
                            textAlign: 'center',
                        }}>
                            No curated prayers yet
                        </Text>
                        <Text style={{
                            fontSize: 14,
                            color: theme.colors.textSecondary,
                            marginTop: theme.Spacing.sm,
                            textAlign: 'center',
                        }}>
                            Create your first inspirational prayer
                        </Text>
                    </View>
                ) : (
                    curatedPrayers.map(prayer => (
                        <CuratedPrayerCard key={prayer.id} prayer={prayer} />
                    ))
                )}
            </ScrollView>

            {/* Create/Edit Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => !submitting && setModalVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
                    {/* Modal Header */}
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingHorizontal: theme.Spacing.md,
                        paddingVertical: theme.Spacing.lg,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.border,
                    }}>
                        <TouchableOpacity
                            onPress={() => setModalVisible(false)}
                            disabled={submitting}
                        >
                            <Text style={{
                                color: submitting ? theme.colors.textSecondary : theme.colors.text,
                                fontSize: 16
                            }}>
                                Cancel
                            </Text>
                        </TouchableOpacity>

                        <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text }}>
                            {editingPrayer ? 'Edit Prayer' : 'Create Curated Prayer'}
                        </Text>

                        <TouchableOpacity
                            onPress={submitCuratedPrayer}
                            disabled={submitting || !title.trim() || !content.trim()}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color={theme.colors.accentPrimary} />
                            ) : (
                                <Text style={{
                                    color: (title.trim() && content.trim())
                                        ? theme.colors.accentPrimary
                                        : theme.colors.textSecondary,
                                    fontSize: 16,
                                    fontWeight: '600'
                                }}>
                                    {editingPrayer ? 'Update' : 'Create'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Modal Content */}
                    <ScrollView style={{ flex: 1, padding: theme.Spacing.md }}>
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '500',
                            color: theme.colors.text,
                            marginBottom: theme.Spacing.sm,
                        }}>
                            Title
                        </Text>
                        <TextInput
                            style={[theme.input, { marginBottom: theme.Spacing.lg }]}
                            placeholder="Prayer title"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={title}
                            onChangeText={setTitle}
                            maxLength={100}
                        />

                        <Text style={{
                            fontSize: 16,
                            fontWeight: '500',
                            color: theme.colors.text,
                            marginBottom: theme.Spacing.sm,
                        }}>
                            Content
                        </Text>
                        <TextInput
                            style={[theme.input, {
                                height: 150,
                                textAlignVertical: 'top',
                                marginBottom: theme.Spacing.lg,
                            }]}
                            placeholder="Prayer content..."
                            placeholderTextColor={theme.colors.textSecondary}
                            value={content}
                            onChangeText={setContent}
                            multiline
                            numberOfLines={6}
                        />

                        <Text style={{
                            fontSize: 16,
                            fontWeight: '500',
                            color: theme.colors.text,
                            marginBottom: theme.Spacing.sm,
                        }}>
                            Category (Optional)
                        </Text>
                        <TextInput
                            style={[theme.input, { marginBottom: theme.Spacing.lg }]}
                            placeholder="e.g., Healing, Peace, Strength"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={category}
                            onChangeText={setCategory}
                            maxLength={50}
                        />

                        <Text style={{
                            fontSize: 16,
                            fontWeight: '500',
                            color: theme.colors.text,
                            marginBottom: theme.Spacing.sm,
                        }}>
                            Type
                        </Text>
                        <View style={{ flexDirection: 'row', gap: theme.Spacing.sm, marginBottom: theme.Spacing.lg }}>
                            {(['prayer', 'scripture', 'blessing'] as const).map((prayerType) => (
                                <TouchableOpacity
                                    key={prayerType}
                                    onPress={() => setType(prayerType)}
                                    style={{
                                        flex: 1,
                                        padding: theme.Spacing.sm,
                                        borderRadius: theme.BorderRadius.md,
                                        backgroundColor: type === prayerType
                                            ? theme.colors.accentPrimary
                                            : theme.colors.backgroundCard,
                                        borderWidth: 1,
                                        borderColor: type === prayerType
                                            ? theme.colors.accentPrimary
                                            : theme.colors.border,
                                        alignItems: 'center',
                                    }}
                                >
                                    <Text style={{
                                        fontSize: 12,
                                        fontWeight: '500',
                                        color: type === prayerType
                                            ? theme.colors.textInverse
                                            : theme.colors.textSecondary,
                                        textTransform: 'capitalize',
                                    }}>
                                        {prayerType}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={{
                            backgroundColor: theme.colors.accentPrimary + '15',
                            padding: theme.Spacing.md,
                            borderRadius: theme.BorderRadius.md,
                        }}>
                            <Text style={{
                                fontSize: 12,
                                color: theme.colors.accentPrimary,
                                lineHeight: 16,
                            }}>
                                💫 Curated prayers will be visible to all users in the &#34;Curated Prayers&#34; section.
                                You can toggle visibility using the eye icon.
                            </Text>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}