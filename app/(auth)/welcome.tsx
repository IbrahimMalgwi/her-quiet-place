import React from 'react';
import {
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../constants/theme';

const features = [
    {
        icon: 'sunny-outline',
        title: 'Daily comfort',
        description: 'Quotes, verses, prayers, and affirmations',
        color: '#f59e0b',
    },
    {
        icon: 'book-outline',
        title: 'Private journal',
        description: 'A quiet space for honest reflection',
        color: '#8b5cf6',
    },
    {
        icon: 'heart-outline',
        title: 'Prayer room',
        description: 'Share requests and support others',
        color: '#ef4444',
    },
    {
        icon: 'musical-notes-outline',
        title: 'Peaceful audio',
        description: 'Listen when you need a gentle pause',
        color: '#10b981',
    },
] as const;

export default function WelcomeScreen() {
    const theme = useTheme();
    const router = useRouter();

    return (
        <View style={theme.screen}>
            <StatusBar barStyle={theme.colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

            <View style={{
                position: 'absolute',
                top: -90,
                right: -70,
                width: 230,
                height: 230,
                borderRadius: 115,
                backgroundColor: theme.colors.accentSecondary + '70',
            }} />
            <View style={{
                position: 'absolute',
                top: 190,
                left: -80,
                width: 170,
                height: 170,
                borderRadius: 85,
                backgroundColor: theme.colors.accentPrimary + '20',
            }} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingHorizontal: theme.Spacing.lg,
                    paddingTop: theme.Spacing.xxl,
                    paddingBottom: theme.Spacing.lg,
                }}
            >
                <View style={{ flex: 1 }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        alignSelf: 'flex-start',
                        backgroundColor: theme.colors.backgroundCard + 'D9',
                        borderRadius: theme.BorderRadius.round,
                        paddingHorizontal: theme.Spacing.md,
                        paddingVertical: theme.Spacing.sm,
                        borderWidth: 1,
                        borderColor: theme.colors.accentPrimary + '35',
                    }}>
                        <Ionicons name="leaf-outline" size={17} color={theme.colors.accentPrimary} />
                        <Text style={{
                            color: theme.colors.accentPrimary,
                            fontSize: 13,
                            fontWeight: '700',
                            marginLeft: theme.Spacing.sm,
                            letterSpacing: 0.4,
                        }}>
                            HER QUIET PLACE
                        </Text>
                    </View>

                    <View style={{ marginTop: theme.Spacing.xxl }}>
                        <Text style={{
                            color: theme.colors.text,
                            fontSize: 42,
                            fontWeight: '800',
                            lineHeight: 48,
                            letterSpacing: -1,
                        }}>
                            A softer place{'\n'}to land.
                        </Text>
                        <Text style={{
                            color: theme.colors.textSecondary,
                            fontSize: 16,
                            lineHeight: 24,
                            marginTop: theme.Spacing.md,
                            maxWidth: 340,
                        }}>
                            Take a quiet moment for comfort, reflection, prayer, and the strength to begin again.
                        </Text>
                    </View>

                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: theme.Spacing.lg,
                    }}>
                        <View style={{
                            width: 38,
                            height: 2,
                            backgroundColor: theme.colors.accentPrimary,
                            marginRight: theme.Spacing.sm,
                        }} />
                        <Text style={{
                            color: theme.colors.accentPrimary,
                            fontSize: 13,
                            fontStyle: 'italic',
                            fontWeight: '600',
                        }}>
                            where wounded hearts find rest
                        </Text>
                    </View>

                    <View style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: theme.Spacing.sm,
                        marginTop: theme.Spacing.xxl,
                    }}>
                        {features.map(feature => (
                            <View
                                key={feature.title}
                                style={{
                                    width: '48%',
                                    minHeight: 130,
                                    backgroundColor: theme.colors.backgroundCard + 'E6',
                                    borderRadius: theme.BorderRadius.lg,
                                    padding: theme.Spacing.md,
                                    borderWidth: 1,
                                    borderColor: theme.colors.border + '80',
                                }}
                            >
                                <View style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 18,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: feature.color + '18',
                                }}>
                                    <Ionicons name={feature.icon} size={19} color={feature.color} />
                                </View>
                                <Text style={{
                                    color: theme.colors.text,
                                    fontSize: 14,
                                    fontWeight: '700',
                                    marginTop: theme.Spacing.sm,
                                }}>
                                    {feature.title}
                                </Text>
                                <Text style={{
                                    color: theme.colors.textSecondary,
                                    fontSize: 12,
                                    lineHeight: 17,
                                    marginTop: theme.Spacing.xs,
                                }}>
                                    {feature.description}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={{
                    marginTop: theme.Spacing.xl,
                    backgroundColor: theme.colors.backgroundCard + 'E6',
                    borderRadius: theme.BorderRadius.xl,
                    padding: theme.Spacing.md,
                    borderWidth: 1,
                    borderColor: theme.colors.border + '80',
                }}>
                    <TouchableOpacity
                        style={[theme.button, { paddingVertical: theme.Spacing.md }]}
                        activeOpacity={0.85}
                        onPress={() => router.push('/(auth)/signup')}
                    >
                        <Text style={theme.buttonText}>Create your quiet space</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={{
                            alignItems: 'center',
                            paddingVertical: theme.Spacing.md,
                            marginTop: theme.Spacing.xs,
                        }}
                        onPress={() => router.push('/(auth)/login')}
                    >
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
                            Already have an account?{' '}
                            <Text style={{ color: theme.colors.accentPrimary, fontWeight: '700' }}>
                                Sign in
                            </Text>
                        </Text>
                    </TouchableOpacity>

                    <Text style={{
                        color: theme.colors.textSecondary,
                        fontSize: 10,
                        lineHeight: 14,
                        textAlign: 'center',
                    }}>
                        By continuing, you agree to our Terms of Service and Privacy Policy.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}
