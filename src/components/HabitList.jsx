import HabitItem from './HabitItem.jsx'

export default function HabitList({
  habits,
  onToggleDay,
  onDeleteHabit,
  onRenameHabit,
}) {
  return (
    <div className="protocolList">
      {habits.map((h) => (
        <HabitItem
          key={h.id}
          habit={h}
          stitchLayout
          onToggleDay={onToggleDay}
          onDeleteHabit={onDeleteHabit}
          onRenameHabit={onRenameHabit}
        />
      ))}
    </div>
  )
}
