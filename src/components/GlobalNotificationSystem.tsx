'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/lib/engine/store';
import { GameNotification, NotificationRef } from './GameNotification';

export function GlobalNotificationSystem() {
    const notifications = useGameStore(state => state.notifications);
    const notificationRef = useRef<NotificationRef>(null);
    const processedIds = useRef(new Set<string>());

    useEffect(() => {
        // Process new notifications that haven't been shown yet
        notifications.forEach(notif => {
            if (!processedIds.current.has(notif.id)) {
                processedIds.current.add(notif.id);
                notificationRef.current?.notify({
                    type: notif.type,
                    title: notif.title,
                    description: notif.description,
                    icon: notif.icon
                });
            }
        });
    }, [notifications]);

    return <GameNotification ref={notificationRef} />;
}
