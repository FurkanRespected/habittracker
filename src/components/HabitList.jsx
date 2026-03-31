import HabitItem from './HabitItem.jsx'

export default function HabitList({
  habits,
  onToggleDay,
  onDeleteHabit,
  onRenameHabit,
}) {
  return (
    <div className="habitList">
      {habits.map((h) => (
        <HabitItem
          key={h.id}
          habit={h}
          onToggleDay={onToggleDay}
          onDeleteHabit={onDeleteHabit}
          onRenameHabit={onRenameHabit}
        />
      ))}
    </div>
  )
}
