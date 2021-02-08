using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;

namespace rogue_like_multi_server
{
    public class DictionaryWithEnumKeyConverter<T, U> : JsonConverter where T : Enum
    {
        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
        {
            var dictionary = (Dictionary<T, U>)value;

            writer.WriteStartObject();

            foreach (KeyValuePair<T, U> pair in dictionary)
            {
                writer.WritePropertyName(Convert.ToInt32(pair.Key).ToString());
                writer.WriteValue(pair.Value);
            }

            writer.WriteEndObject();
        }

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
        {
            var result = new Dictionary<T, U>();
            var jObject = JObject.Load(reader);

            foreach (var x in jObject)
            {
                T key = (T) (object) int.Parse(x.Key); // A bit of boxing here but hey
                U value = (U) x.Value.ToObject(typeof(U));
                result.Add(key, value);
            }

            return result;
        }

        public override bool CanConvert(Type objectType)
        {
            return typeof(IDictionary<T, U>) == objectType;
        }
    }
}
