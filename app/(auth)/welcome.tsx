// app/(auth)/welcome.tsx
import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Dimensions,
} from 'react-native';
import { useTheme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function WelcomeScreen() {
    const theme = useTheme();
    const router = useRouter();

    const features = [
        {
            icon: 'heart-outline',
            title: 'Daily Strength',
            description: 'Receive daily quotes, verses, and prayers to uplift your spirit'
        },
        {
            icon: 'book-outline',
            title: 'Personal Journal',
            description: 'Write your thoughts and reflections in a private, secure space'
        },
        {
            icon: 'people-outline',
            title: 'Prayer Community',
            description: 'Share prayer requests and support others in their journey'
        },
        {
            icon: 'musical-notes-outline',
            title: 'Audio Comforts',
            description: 'Listen to guided devotionals and peaceful audio content'
        }
    ];

    const purposePoints = [
        'Reflect and recharge emotionally',
        'Hear gentle words that lift your spirits',
        'Feel less alone during difficult seasons'
    ];

    return (
        <View style={[theme.screen, { paddingHorizontal: 0 }]}>
            <StatusBar barStyle={theme.colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={{
                paddingHorizontal: theme.Spacing.xl,
                paddingTop: theme.Spacing.xxl,
                paddingBottom: theme.Spacing.lg,
                alignItems: 'center',
                backgroundColor: theme.colors.accentPrimary + '08',
            }}>
                <View style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: theme.colors.accentPrimary + '20',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: theme.Spacing.md,
                    borderWidth: 2,
                    borderColor: theme.colors.accentPrimary + '30',
                }}>
                    <Ionicons name="leaf-outline" size={36} color={theme.colors.accentPrimary} />
                </View>

                <Text style={{
                    fontSize: 32,
                    fontWeight: 'bold',
                    color: theme.colors.text,
                    textAlign: 'center',
                    marginBottom: theme.Spacing.xs,
                    lineHeight: 38,
                }}>
                    Her Quiet Place
                </Text>

                <Text style={{
                    fontSize: 16,
                    color: theme.colors.accentPrimary,
                    textAlign: 'center',
                    fontStyle: 'italic',
                    marginBottom: theme.Spacing.md,
                    lineHeight: 22,
                }}>
                    ...where wounded hearts find rest
                </Text>
            </View>

            {/* Vision Statement - Moved up with reduced margin */}
            <View style={{
                paddingHorizontal: theme.Spacing.lg,
                paddingVertical: theme.Spacing.md,
                backgroundColor: theme.colors.backgroundCard,
                marginHorizontal: theme.Spacing.lg,
                marginTop: theme.Spacing.lg, // Reduced from xl to lg
                borderRadius: theme.BorderRadius.lg,
                borderLeftWidth: 4,
                borderLeftColor: theme.colors.accentPrimary,
            }}>
                <Text style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: theme.colors.text,
                    marginBottom: theme.Spacing.sm,
                    textAlign: 'center',
                }}>
                    A sanctuary for women navigating emotional overwhelm
                </Text>
                <Text style={{
                    fontSize: 13,
                    color: theme.colors.textSecondary,
                    lineHeight: 18,
                    textAlign: 'center',
                }}>
                    Whether you're single, married, divorced, or silently struggling — this is your soft place to land, offering hope, healing, and strength one quiet moment at a time.
                </Text>
            </View>

            {/* Features List */}
            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingHorizontal: theme.Spacing.xl,
                    paddingVertical: theme.Spacing.lg,
                }}
            >
                <Text style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: theme.colors.text,
                    textAlign: 'center',
                    marginBottom: theme.Spacing.lg,
                }}>
                    What Awaits You
                </Text>

                {features.map((feature, index) => (
                    <View
                        key={feature.title}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                            marginBottom: theme.Spacing.md, // Reduced from lg to md
                            backgroundColor: theme.colors.backgroundCard,
                            padding: theme.Spacing.md, // Reduced from lg to md
                            borderRadius: theme.BorderRadius.lg,
                            borderLeftWidth: 4,
                            borderLeftColor: theme.colors.accentPrimary,
                            shadowColor: theme.colors.black,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 8,
                            elevation: 3,
                        }}
                    >
                        <View style={{
                            backgroundColor: theme.colors.accentPrimary + '15',
                            padding: theme.Spacing.sm, // Reduced from md to sm
                            borderRadius: theme.BorderRadius.round,
                            marginRight: theme.Spacing.md,
                            marginTop: 2,
                        }}>
                            <Ionicons
                                name={feature.icon as any}
                                size={20} // Reduced from 24 to 20
                                color={theme.colors.accentPrimary}
                            />
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text style={{
                                fontSize: 16, // Reduced from 18 to 16
                                fontWeight: '600',
                                color: theme.colors.text,
                                marginBottom: theme.Spacing.xs,
                            }}>
                                {feature.title}
                            </Text>
                            <Text style={{
                                fontSize: 13, // Reduced from 14 to 13
                                color: theme.colors.textSecondary,
                                lineHeight: 18, // Reduced from 20 to 18
                            }}>
                                {feature.description}
                            </Text>
                        </View>
                    </View>
                ))}

                {/* Core Purpose Section */}
                <View style={{
                    backgroundColor: theme.colors.accentPrimary + '08',
                    padding: theme.Spacing.lg, // Reduced from xl to lg
                    borderRadius: theme.BorderRadius.lg,
                    marginTop: theme.Spacing.md,
                    borderWidth: 1,
                    borderColor: theme.colors.accentPrimary + '20',
                }}>
                    <Text style={{
                        fontSize: 16, // Reduced from 18 to 16
                        fontWeight: 'bold',
                        color: theme.colors.text,
                        textAlign: 'center',
                        marginBottom: theme.Spacing.md, // Reduced from lg to md
                    }}>
                        Your Safe Space to:
                    </Text>

                    {purposePoints.map((point, index) => (
                        <View key={index} style={{
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                            marginBottom: theme.Spacing.sm, // Reduced from md to sm
                        }}>
                            <Ionicons
                                name="checkmark-circle"
                                size={18} // Reduced from 20 to 18
                                color={theme.colors.accentPrimary}
                                style={{ marginRight: theme.Spacing.sm, marginTop: 1 }}
                            />
                            <Text style={{
                                fontSize: 13, // Reduced from 14 to 13
                                color: theme.colors.text,
                                lineHeight: 18, // Reduced from 20 to 18
                                flex: 1,
                            }}>
                                {point}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Target Audience Note */}
                <View style={{
                    backgroundColor: theme.colors.backgroundSecondary,
                    padding: theme.Spacing.md, // Reduced from lg to md
                    borderRadius: theme.BorderRadius.lg,
                    marginTop: theme.Spacing.md, // Reduced from lg to md
                    borderLeftWidth: 3,
                    borderLeftColor: theme.colors.accentSecondary,
                }}>
                    <Text style={{
                        fontSize: 11, // Reduced from 12 to 11
                        color: theme.colors.textSecondary,
                        textAlign: 'center',
                        lineHeight: 16, // Reduced from 18 to 16
                        fontStyle: 'italic',
                    }}>
                        Designed for women (ages 20+) seeking emotional comfort and spiritual strength.
                        Our content thoughtfully blends faith-inspired guidance with universal emotional support.
                    </Text>
                </View>
            </ScrollView>

            {/* Action Buttons - Now side by side */}
            <View style={{
                paddingHorizontal: theme.Spacing.lg, // Reduced from xl to lg
                paddingVertical: theme.Spacing.md, // Reduced from lg to md
                borderTopWidth: 1,
                borderTopColor: theme.colors.border + '30',
                gap: theme.Spacing.md,
                backgroundColor: theme.colors.background,
            }}>
                <View style={{
                    flexDirection: 'row',
                    gap: theme.Spacing.md,
                }}>
                    <TouchableOpacity
                        style={[theme.button, {
                            flex: 1,
                            backgroundColor: theme.colors.accentPrimary,
                            paddingVertical: theme.Spacing.md, // Reduced from lg to md
                        }]}
                        onPress={() => router.push('/(auth)/login' as any)}
                    >
                        <Text style={[theme.buttonText, {
                            color: theme.colors.textInverse,
                            fontSize: 14, // Reduced from 16 to 14
                            fontWeight: '600',
                        }]}>
                            Sign In
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[theme.button, {
                            flex: 1,
                            backgroundColor: 'transparent',
                            borderWidth: 2,
                            borderColor: theme.colors.accentPrimary,
                            paddingVertical: theme.Spacing.md, // Reduced from lg to md
                        }]}
                        onPress={() => router.push('/(auth)/signup' as any)}
                    >
                        <Text style={[theme.buttonText, {
                            color: theme.colors.accentPrimary,
                            fontSize: 14, // Reduced from 16 to 14
                            fontWeight: '600',
                        }]}>
                            Create Account
                        </Text>
                    </TouchableOpacity>
                </View>

                <Text style={{
                    fontSize: 10, // Reduced from 11 to 10
                    color: theme.colors.textSecondary,
                    textAlign: 'center',
                    marginTop: theme.Spacing.xs, // Reduced from sm to xs
                    lineHeight: 14, // Reduced from 16 to 14
                }}>
                    By continuing, you agree to our Terms of Service and Privacy Policy
                </Text>
            </View>
        </View>
    );
}