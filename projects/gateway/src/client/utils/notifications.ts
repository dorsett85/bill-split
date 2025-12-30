import {
  type NotificationData,
  showNotification,
} from '@mantine/notifications';

// All notifications used in React components must be wrapped with
// MantineProvider and Mantine Notifications.

export const successNotification = (data: NotificationData): void => {
  showNotification({
    ...data,
    color: 'green',
  });
};

export const errorNotification = (data: NotificationData): void => {
  showNotification({
    ...data,
    color: 'red',
  });
};
