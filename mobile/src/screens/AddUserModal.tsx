import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, TextInput, ScrollView, Alert } from 'react-native';
import { X, Check, ShieldCheck, Mail, Lock, User } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '../constants/Theme';
import { usersAPI } from '../api/client';

const ROLES = [
    { id: 'ADMIN', label: 'ADMINISTRATOR', color: '#EAB308' },
    { id: 'MANAGER', label: 'MANAGER', color: '#3B82F6' },
    { id: 'USER', label: 'STANDARD USER', color: '#94A3B8' }
];

interface AddUserModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddUserModal({ visible, onClose, onSuccess }: AddUserModalProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'ADMIN' | 'MANAGER' | 'USER'>('USER');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!name || !email || !password) {
            Alert.alert('Missing Details', 'Please provide name, email, and password.');
            return;
        }

        setLoading(true);
        try {
            await usersAPI.create({
                name,
                email,
                password,
                role
            } as any);
            onSuccess();
        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', error.response?.data?.error || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
                >
                    <View style={styles.modalContainer}>
                        {/* Header */}
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.title}>NEW IDENTITY</Text>
                                <Text style={styles.subtitle}>PROVISION NEW ACCESS CREDENTIALS</Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <X size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.content}>

                                {/* Name Input */}
                                <View style={styles.fieldContainer}>
                                    <View style={styles.labelRow}>
                                        <User size={12} color="#C5A059" />
                                        <Text style={styles.label}>FULL NAME</Text>
                                    </View>
                                    <View style={styles.inputWrapper}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Jane Doe"
                                            placeholderTextColor="rgba(255,255,255,0.2)"
                                            value={name}
                                            onChangeText={setName}
                                        />
                                    </View>
                                </View>

                                {/* Email Input */}
                                <View style={styles.fieldContainer}>
                                    <View style={styles.labelRow}>
                                        <Mail size={12} color="#C5A059" />
                                        <Text style={styles.label}>EMAIL ADDRESS</Text>
                                    </View>
                                    <View style={styles.inputWrapper}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="jane@estommy.com"
                                            placeholderTextColor="rgba(255,255,255,0.2)"
                                            value={email}
                                            onChangeText={setEmail}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />
                                    </View>
                                </View>

                                {/* Password Input */}
                                <View style={styles.fieldContainer}>
                                    <View style={styles.labelRow}>
                                        <Lock size={12} color="#C5A059" />
                                        <Text style={styles.label}>PASSWORD</Text>
                                    </View>
                                    <View style={styles.inputWrapper}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="••••••••"
                                            placeholderTextColor="rgba(255,255,255,0.2)"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry
                                        />
                                    </View>
                                </View>

                                {/* Role Selection */}
                                <Text style={styles.sectionLabel}>ACCESS LEVEL</Text>
                                <View style={styles.roleList}>
                                    {ROLES.map((r) => {
                                        const isSelected = role === r.id;
                                        return (
                                            <TouchableOpacity
                                                key={r.id}
                                                style={[
                                                    styles.roleOption,
                                                    isSelected && { borderColor: r.color, backgroundColor: `${r.color}10` }
                                                ]}
                                                onPress={() => setRole(r.id as any)}
                                            >
                                                <View style={[styles.radioCircle, isSelected && { borderColor: r.color }]}>
                                                    {isSelected && <View style={[styles.radioFill, { backgroundColor: r.color }]} />}
                                                </View>
                                                <Text style={[styles.roleLabel, isSelected && { color: r.color }]}>{r.label}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                {/* Submit Button */}
                                <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={loading}>
                                    {loading ? (
                                        <ActivityIndicator color="#000" />
                                    ) : (
                                        <>
                                            <Text style={styles.saveBtnText}>CREATE USER</Text>
                                            <Check size={18} color="#000" />
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyboardView: {
        width: '100%',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#1E1E26',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 32,
    },
    title: {
        fontSize: 14,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 2,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 10,
        color: '#64748B',
        fontWeight: '700',
        letterSpacing: 1,
    },
    closeBtn: {
        padding: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
    },
    content: {
        gap: 20,
    },
    fieldContainer: {
        gap: 8,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    label: {
        fontSize: 10,
        color: '#C5A059',
        fontWeight: '700',
        letterSpacing: 1,
    },
    inputWrapper: {
        height: 52,
        backgroundColor: '#16161D',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    input: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    sectionLabel: {
        fontSize: 10,
        color: '#C5A059',
        fontWeight: '700',
        letterSpacing: 1,
        marginTop: 8,
    },
    roleList: {
        gap: 10,
    },
    roleOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#16161D',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        gap: 16,
    },
    radioCircle: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: '#64748B',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioFill: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    roleLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 1,
    },
    saveBtn: {
        backgroundColor: '#FFF',
        height: 56,
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        marginTop: 16,
    },
    saveBtnText: {
        color: '#000',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 2,
    },
});
