export type RoomType =
  | 'BOARDROOM'
  | 'VIDEO_CONFERENCE'
  | 'MEETING_SUITE';

export type RoomStatus =
  'ACTIVE' | 'MAINTENANCE' | 'RETIRED';

export type RoomEquipmentStatus =
  'ACTIVE' | 'OUT_OF_SERVICE' | 'RETIRED';

// Request sent when creating a room.
// No roomId is included.
export interface CreateRoomRequest {
  roomName: string;
  roomType: RoomType;
  capacity: number;
  hourlyRate: number;
  status: RoomStatus;
  description: string;
}

// Existing room returned by the backend.
export interface MeetingRoom {
  roomId: string;
  roomName: string;
  roomType: RoomType;
  capacity: number;
  hourlyRate: number;
  status: RoomStatus;
  description: string;
}

export interface RoomEquipment {
  equipmentName: string;
  assetCode: string;
  description: string;
  status: RoomEquipmentStatus;
}

export interface RoomDetails extends MeetingRoom {
  equipment: RoomEquipment[];
}
