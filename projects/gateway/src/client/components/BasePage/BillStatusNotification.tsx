import {
  Box,
  Notification,
  type NotificationProps,
  Progress,
} from '@mantine/core';
import type React from 'react';
import type { ImageStatus } from '../../pages/bills/[id]/dto.ts';

type BillStatusNotificationProps = {
  analyzeProgress: number;
  imageStatus: ImageStatus;
};

export const BillStatusNotification: React.FC<BillStatusNotificationProps> = ({
  analyzeProgress,
  imageStatus,
}) => {
  const notificationProps: Pick<
    NotificationProps,
    'children' | 'color' | 'title'
  > = (() => {
    switch (imageStatus) {
      case 'parsing':
        return {
          children: (
            <Progress
              animated
              value={analyzeProgress}
              m="md"
              size="md"
              color={'yellow'}
              transitionDuration={250}
            />
          ),
          color: 'yellow',
          title:
            "We're still analyzing your bill. You can add participants in the meantime below!",
        };
      case 'error':
        return {
          children: (
            <Box m="sm">
              Click <a href="/">here</a> to try again
            </Box>
          ),
          color: 'red',
          title: 'Something went wrong analyzing your bill',
        };
      case 'ready':
        return {
          children: (
            <Box m="sm">Add participants and assign bill items below</Box>
          ),
          color: 'green',
          title: 'Your bill has been successfully analyzed!',
        };
    }
  })();

  return (
    <Notification {...notificationProps} mb="xl" withCloseButton={false} />
  );
};
